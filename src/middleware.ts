import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { REF_COOKIE, normalizeResellerCode } from '@/lib/script-catalog';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
};

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/scripts/')) {
    return NextResponse.json({ error: 'Direct download is disabled.' }, { status: 403 });
  }

  const response = NextResponse.next();

  const ref = normalizeResellerCode(request.nextUrl.searchParams.get('ref'));
  if (ref) {
    response.cookies.set(REF_COOKIE, ref, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/command') ||
    request.nextUrl.pathname.startsWith('/ops') ||
    request.nextUrl.pathname.startsWith('/dashboard/reseller')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
