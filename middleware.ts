import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const BASIC_USERNAME = process.env.SITE_ACCESS_USERNAME ?? 'water-admin';
const BASIC_PASSWORD = process.env.SITE_ACCESS_PASSWORD;
const REALM = 'Water Report Studio';

const decodeBasicAuth = (header: string | null): string | null => {
  if (!header || !header.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64 = header.slice('Basic '.length).trim();
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error('[middleware] Failed to decode basic auth header', error);
    return null;
  }
};

export function middleware(request: NextRequest) {
  if (!BASIC_PASSWORD) {
    console.error('[middleware] SITE_ACCESS_PASSWORD is not set.');
    return new NextResponse('Server misconfiguration', { status: 500 });
  }

  const credentials = decodeBasicAuth(request.headers.get('authorization'));
  const expected = `${BASIC_USERNAME}:${BASIC_PASSWORD}`;

  if (credentials === expected) {
    return NextResponse.next();
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}"`,
    },
  });
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
