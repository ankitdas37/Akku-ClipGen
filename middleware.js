import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'akku_admin_session';

// Web Crypto API — works in Edge runtime (middleware)
async function makeToken() {
  const user   = process.env.ADMIN_USERNAME || 'admin';
  const pass   = process.env.ADMIN_PASSWORD || 'Akku@2024';
  const secret = process.env.ADMIN_SECRET   || 'fallback-secret';

  const enc    = new TextEncoder();
  const key    = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig    = await crypto.subtle.sign('HMAC', key, enc.encode(`${user}:${pass}`));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* — pass through login page and admin APIs
  if (!pathname.startsWith('/admin') || pathname === '/admin/login' || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const validToken    = await makeToken();

  if (sessionCookie?.value === validToken) {
    return NextResponse.next();   // ✅ Authenticated
  }

  // ❌ Redirect to login
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
