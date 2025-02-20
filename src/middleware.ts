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
    '/((?!_next/static|_next/image|favicon.ico|locales|assets|api/stripe/webhook).*)',
  ],
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/zoom/webhook')) {
    return NextResponse.next();
  }
  const response = NextResponse.next();
  const csrfResponse = await withCsrfMiddleware(request, response);
  const sessionResponse = await sessionMiddleware(request, csrfResponse);

  // return await adminMiddleware(request, sessionResponse);
  return await roleBasedMiddleware(request, sessionResponse);
}

async function sessionMiddleware(req: NextRequest, res: NextResponse) {
  const supabase = createMiddlewareClient(req, res);

  await supabase.auth.getSession();
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

async function roleBasedMiddleware(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  const isInAppPath = pathname.startsWith('/admin') || pathname.startsWith('/tutor') || pathname.startsWith('/student');

  if (!isInAppPath) {
    return response;
  }

  const supabase = createMiddlewareClient(request, response);
  const { data: user, error } = await supabase.auth.getUser();
  console.log('-----role----------User:', user);

  // If the user is not authenticated, redirect to sign-in
  if (error || !user?.user) {
    console.error('User not authenticated:', error?.message || 'No user found');
    return NextResponse.redirect(configuration.paths.signIn);
  }

  const userId = user.user?.id;

  if (!userId) {
    return NextResponse.redirect(configuration.paths.signIn);
  }

  const userRole = user.user?.user_metadata['role'] || user.user?.user_metadata['userRole'] || user.user?.user_metadata['user_role'] || 'admin';
  console.log('-----role----------User Role:', userRole, pathname, pathname.startsWith('/tutors') );

  // Restrict access based on user userRole
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  if (pathname.startsWith('/tutors') && userRole !== 'admin') {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  if (pathname.startsWith('/students') && userRole !== 'tutor' && userRole !== 'admin') {
    return NextResponse.redirect(`${configuration.site.siteUrl}/404`);
  }

  return response;
}