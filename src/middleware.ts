import { NextRequest, NextResponse } from 'next/server';
import csrf from 'edge-csrf';

import HttpStatusCode from '~/core/generic/http-status-code.enum';
import configuration from '~/configuration';
import createMiddlewareClient from '~/core/supabase/middleware-client';
import GlobalRole from '~/core/session/types/global-role';
import { getUserById } from '~/lib/user/database/queries';

const CSRF_SECRET_COOKIE = 'csrfSecret';
const NEXT_ACTION_HEADER = 'next-action';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|locales|assets|api/stripe/webhook|cron).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  console.log('Middleware called for path:', request.nextUrl.pathname);
  if (request.nextUrl.pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }
  const response = NextResponse.next();
  console.log('Starting CSRF middleware for:', request.nextUrl.pathname);
  const csrfResponse = await withCsrfMiddleware(request, response);
  console.log('CSRF middleware completed in', Date.now() - startTime, 'ms for:', request.nextUrl.pathname);
  console.log('Starting session middleware for:', request.nextUrl.pathname);
  const sessionResponse = await sessionMiddleware(request, csrfResponse);

  // return await adminMiddleware(request, sessionResponse);
  const finalResponse = await roleBasedMiddleware(request, sessionResponse);
  console.log('Role-based middleware completed in', Date.now() - startTime, 'ms for:', request.nextUrl.pathname);
  console.log('Total middleware processing time:', Date.now() - startTime, 'ms for:', request.nextUrl.pathname);
  return finalResponse;
}

async function sessionMiddleware(req: NextRequest, res: NextResponse) {
  const supabase = createMiddlewareClient(req, res);
  console.log('Starting session retrieval for:', req.nextUrl.pathname);
  const startTime = Date.now();
  await supabase.auth.getSession();
  const endTime = Date.now();
  console.log('Session retrieval took:', endTime - startTime, 'ms for:', req.nextUrl.pathname);
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

async function adminMiddleware(request: NextRequest, response: NextResponse) {
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  if (!isAdminPath) {
    return response;
  }

  const supabase = createMiddlewareClient(request, response);
  const user = await supabase.auth.getUser();
  console.log('-----------User:', user);

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
    pathname.startsWith('/student');
  const isMoreDetailsPath = pathname.startsWith('/auth/sign-up/moredetails');

  // Store the current URL in headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-url', request.url);
  response.headers.set('x-request-url', request.url);

  if (!isInAppPath && !isMoreDetailsPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const supabase = createMiddlewareClient(request, response);
  const { data: user, error } = await supabase.auth.getUser();
  console.log('-----role----------User:', user);

  // If the user is not authenticated, redirect to sign-in (except for moredetails page)
  if (error || !user?.user) {
    if (isMoreDetailsPath) {
      // For moredetails page, redirect to sign-in if not authenticated
      return NextResponse.redirect(
        new URL(configuration.paths.signIn, configuration.site.siteUrl),
      );
    }

    const signInUrl = new URL(
      configuration.paths.signIn,
      configuration.site.siteUrl,
    );

    // Preserve the redirect URL if it exists, otherwise use current path
    const redirectUrl =
      request.nextUrl.searchParams.get('redirectUrl') ||
      `${pathname}${request.nextUrl.search}`;

    if (redirectUrl) {
      signInUrl.searchParams.set('redirectUrl', redirectUrl);
    }

    return NextResponse.redirect(signInUrl);
  }

  const userId = user.user?.id;

  if (!userId) {
    return NextResponse.redirect(
      new URL(configuration.paths.signIn, configuration.site.siteUrl),
    );
  }

  // Allow access to moredetails page for authenticated users
  if (isMoreDetailsPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For protected app paths, check if user needs to complete profile
  if (isInAppPath) {
    try {
      const userData = await getUserById(
        createMiddlewareClient(request, response),
        userId,
      );

      // Check if user has completed their profile
      const hasRequiredDetails =
        userData?.first_name &&
        userData?.last_name &&
        userData?.phone_number &&
        userData.first_name.trim() !== '' &&
        userData.last_name.trim() !== '' &&
        userData.phone_number.trim() !== '';

      if (!hasRequiredDetails) {
        // Redirect to complete profile page with current path as return URL
        const moreDetailsUrl = new URL(
          '/auth/sign-up/moredetails',
          configuration.site.siteUrl,
        );
        moreDetailsUrl.searchParams.set(
          'returnUrl',
          `${pathname}${request.nextUrl.search}`,
        );
        return NextResponse.redirect(moreDetailsUrl);
      }
    } catch (userError) {
      // If user data doesn't exist, they need to complete profile
      const moreDetailsUrl = new URL(
        '/auth/sign-up/moredetails',
        configuration.site.siteUrl,
      );
      moreDetailsUrl.searchParams.set(
        'returnUrl',
        `${pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(moreDetailsUrl);
    }
  }

  const userRole =
    user.user?.user_metadata['role'] ||
    user.user?.user_metadata['userRole'] ||
    user.user?.user_metadata['user_role'] ||
    'admin';
  console.log(
    '-----role----------User Role:',
    userRole,
    pathname,
    pathname.startsWith('/tutors'),
  );

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
