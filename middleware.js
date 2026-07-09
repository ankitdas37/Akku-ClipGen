import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'akku_admin_session';

// Web Crypto API — works in Edge runtime (middleware)
async function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [b64User, signature] = parts;
  const secret = process.env.ADMIN_SECRET || 'fallback-secret';

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(b64User));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return signature === expectedSig;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* — pass through login page and admin APIs
  if (!pathname.startsWith('/admin') || pathname === '/admin/login' || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (sessionCookie?.value && await verifyToken(sessionCookie.value)) {
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
