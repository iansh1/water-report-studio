import { NextRequest, NextResponse } from 'next/server';

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

export async function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const { pathname } = nextUrl;

  try {
    const constantsModule = await import('./src/lib/constants').catch((error) => {
      console.error('[middleware] failed to load constants module', { pathname }, error);
      throw error;
    });
    const { AUTH_COOKIE_NAME, AUTH_REDIRECT_PARAM } = constantsModule;

    const authModule = await import('./src/lib/auth-edge').catch((error) => {
      console.error('[middleware] failed to load auth-edge module', { pathname }, error);
      throw error;
    });
    const { isRequestAuthenticated } = authModule;

    const authToken = cookies.get(AUTH_COOKIE_NAME)?.value;
    const isAuthenticated = await isRequestAuthenticated(authToken);

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
  } catch (error) {
    const baseMessage = `[middleware] ${request.method} ${pathname}`;
    if (error instanceof Error) {
      console.error(`${baseMessage} :: ${error.message}\n${error.stack ?? ''}`);
    } else {
      console.error(`${baseMessage} :: ${String(error)}`);
    }
    const fallback = new URL('/', request.url);
    fallback.searchParams.set('middleware', 'error');
    return NextResponse.redirect(fallback);
  }
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
