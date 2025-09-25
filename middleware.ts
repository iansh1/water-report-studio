import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, AUTH_REDIRECT_PARAM } from './src/lib/constants';
import { isRequestAuthenticated } from './src/lib/auth-edge';

const PUBLIC_PATHS = new Set(['/', '/unlock']);

const isPublic = (pathname: string) => {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/static')) return true;
  if (pathname.startsWith('/favicon.ico')) return true;
  if (/\.([a-zA-Z0-9]+)$/.test(pathname)) return true;
  return false;
};

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const { pathname } = nextUrl;

  const authToken = cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = isRequestAuthenticated(authToken);

  if (pathname === '/unlock' && isAuthenticated) {
    const redirectTo = nextUrl.searchParams.get(AUTH_REDIRECT_PARAM) ?? '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const redirectUrl = new URL('/', request.url);
    const target = `${pathname}${nextUrl.search}`;
    redirectUrl.searchParams.set(AUTH_REDIRECT_PARAM, target);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
