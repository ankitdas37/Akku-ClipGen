const SESSION_COOKIE = 'akku_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

// Must produce the same token as middleware.js (both use Web Crypto HMAC-SHA256)
async function makeToken() {
  const user   = process.env.ADMIN_USERNAME || 'admin';
  const pass   = process.env.ADMIN_PASSWORD || 'Akku@2024';
  const secret = process.env.ADMIN_SECRET   || 'fallback-secret';

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${user}:${pass}`));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── POST /api/admin/login ─────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'Akku@2024';

    if (username !== validUser || password !== validPass) {
      await new Promise(r => setTimeout(r, 800)); // slow brute-force
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token    = await makeToken();
    const response = Response.json({ success: true });
    response.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Strict`
    );
    return response;
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
