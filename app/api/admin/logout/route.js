const SESSION_COOKIE = 'akku_admin_session';

// ── POST /api/admin/logout ─────────────────────────────────────────────────
export async function POST() {
  const response = Response.json({ success: true });
  // Expire the cookie immediately
  response.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
  );
  return response;
}
