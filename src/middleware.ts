import { NextRequest, NextResponse } from 'next/server';
import csrf from 'edge-csrf';
import HttpStatusCode from '~/core/generic/http-status-code.enum';
import configuration from '~/configuration';
import createMiddlewareClient from '~/core/supabase/middleware-client';
import GlobalRole from '~/core/session/types/global-role';

const CSRF_SECRET_COOKIE = 'csrfSecret';
const NEXT_ACTION_HEADER = 'next-action';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|locales|assets|api/stripe/webhook|api/public|cron).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  console.log('Middleware called for path:', request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  // Skip middleware for waiting page to avoid redirect loops
  if (request.nextUrl.pathname === '/waiting') {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  console.log('Starting CSRF middleware for:', request.nextUrl.pathname);
  const csrfResponse = await withCsrfMiddleware(request, response);
  console.log(
    'CSRF middleware completed in',
    Date.now() - startTime,
    'ms for:',
    request.nextUrl.pathname,
  );
  console.log('Starting session middleware for:', request.nextUrl.pathname);
  const sessionResponse = await sessionMiddleware(request, csrfResponse);
  const onboardingResponse = await onboardingMiddleware(
    request,
    sessionResponse,
  );

  return await roleBasedMiddleware(request, onboardingResponse);
}

async function sessionMiddleware(req: NextRequest, res: NextResponse) {
  const supabase = createMiddlewareClient(req, res);
  console.log('Starting session retrieval for:', req.nextUrl.pathname);
  const startTime = Date.now();
  await supabase.auth.getSession();
  const endTime = Date.now();
  console.log(
    'Session retrieval took:',
    endTime - startTime,
    'ms for:',
    req.nextUrl.pathname,
  );
  // const user = await supabase.auth.getSession();
  // console.log('-----1------User:', user);

  return res;
}

async function withCsrfMiddleware(
  request: NextRequest,
  response = new NextResponse(),
) {
  // set up CSRF protection
  const csrfMiddleware = csrf({
    cookie: {
      secure: configuration.production,
      name: CSRF_SECRET_COOKIE,
    },
    // ignore CSRF errors for server actions since protection is built-in
    ignoreMethods: isServerAction(request)
      ? ['POST']
      : // always ignore GET, HEAD, and OPTIONS requests
        ['GET', 'HEAD', 'OPTIONS'],
  });

  const csrfError = await csrfMiddleware(request, response);

  // if there is a CSRF error, return a 403 response
  if (csrfError) {
    return NextResponse.json('Invalid CSRF token', {
      status: HttpStatusCode.Forbidden,
    });
  }

  // otherwise, return the response
  return response;
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}

async function onboardingMiddleware(
  request: NextRequest,
  response: NextResponse,
) {
  const pathname = request.nextUrl.pathname;

  // Skip onboarding check for specific paths including the onboarding page
  const skipOnboardingCheck =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/locales') ||
    pathname === '/' ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === configuration.paths.onboarding;

  if (skipOnboardingCheck) {
    return response;
  }

  const supabase = createMiddlewareClient(request, response);
  const { data: user, error } = await supabase.auth.getUser();

  // If user is not authenticated, let them through (role-based middleware will handle it)
  if (error || !user?.user) {
    return response;
  }

  // Get user role from metadata
  const userRole =
    user.user?.user_metadata['role'] ||
    user.user?.user_metadata['userRole'] ||
    user.user?.user_metadata['user_role'];

  // Only apply onboarding checks to tutors
  if (userRole !== 'tutor') {
    return response;
  }

  // Check if user has completed onboarding by querying the users table
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'birthday, class_size, education_level, identity_url, photo_url, subjects_teach, user_role, is_approved',
      )
      .eq('id', user.user.id)
      .single();

    // If we can't fetch user data or there's an error, allow through
    if (userError || !userData) {
      return response;
    }

    // Double-check user role from database
    if (userData.user_role !== 'tutor') {
      return response;
    }

    // Check if user has completed required onboarding fields (including identity_url)
    const hasRequiredDetails =
      userData.birthday &&
      userData.class_size &&
      userData.education_level &&
      userData.subjects_teach &&
      userData.identity_url &&
      userData.birthday.trim() !== '' &&
      userData.class_size.trim() !== '' &&
      userData.education_level.trim() !== '' &&
      userData.identity_url.trim() !== '' &&
      userData.subjects_teach.length > 0;

    // If user hasn't completed onboarding, redirect to onboarding page
    if (!hasRequiredDetails) {
      const onboardingUrl = new URL(
        configuration.paths.onboarding,
        request.url,
      );
      return NextResponse.redirect(onboardingUrl);
    }

    // If tutor has completed onboarding but is not approved, redirect to waiting page
    if (hasRequiredDetails && !userData.is_approved) {
      const waitingUrl = new URL('/waiting', request.url);
      return NextResponse.redirect(waitingUrl);
    }
  } catch (error) {
    console.error('Error during onboarding checks:', error);
    // If there's any error checking onboarding status, allow through
  }

  return response;
}

async function adminMiddleware(request: NextRequest, response: NextResponse) {
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  if (!isAdminPath) {
    return response;
  }

  const supabase = createMiddlewareClient(request, response);
  const user = await supabase.auth.getUser();

  // If user is not logged in, redirect to sign in page.
  // This should never happen, but just in case.
  if (!user) {
    return NextResponse.redirect(configuration.paths.signIn);
  }

  const role = user.data.user?.app_metadata['role'];

  // If user is not an admin, redirect to 404 page.
  if (!role || role !== GlobalRole.SuperAdmin) {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  // in all other cases, return the response
  return response;
}

async function roleBasedMiddleware(
  request: NextRequest,
  response: NextResponse,
) {
  const pathname = request.nextUrl.pathname;
  const isInAppPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/tutor') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/sessions');

  if (!isInAppPath) {
    return response;
  }

  const supabase = createMiddlewareClient(request, response);
  const { data: user, error } = await supabase.auth.getUser();

  // If the user is not authenticated, redirect to sign-in with the original URL
  if (error || !user?.user) {
    const signInUrl = new URL(configuration.paths.signIn, request.url);
    const originalUrl = request.nextUrl.href;
    signInUrl.searchParams.set('redirectUrl', originalUrl);
    return NextResponse.redirect(signInUrl);
  }

  const userId = user.user?.id;

  if (!userId) {
    return NextResponse.redirect(configuration.paths.signIn);
  }

  const userRole =
    user.user?.user_metadata['role'] ||
    user.user?.user_metadata['userRole'] ||
    user.user?.user_metadata['user_role'] ||
    'admin';

  // Restrict access based on user userRole
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  if (pathname.startsWith('/tutors') && userRole !== 'admin') {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  if (
    pathname.startsWith('/students') &&
    userRole !== 'tutor' &&
    userRole !== 'admin'
  ) {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  return response;
}
