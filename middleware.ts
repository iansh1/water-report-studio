import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Lightweight middleware placeholder. Handling of protected routes now happens
// inside layouts/pages, so we just pass the request through. This keeps Vercel
// from treating the missing middleware entry as a 404.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
