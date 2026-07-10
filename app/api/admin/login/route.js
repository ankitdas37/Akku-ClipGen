import { readFileSync, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const SESSION_COOKIE = 'akku_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function makeToken(username) {
  const secret = process.env.ADMIN_SECRET || 'fallback-secret';
  const b64User = Buffer.from(username).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(b64User).digest('hex');
  return `${b64User}.${signature}`;
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    let isValid = false;

    // Check root admin
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'Akku@2024';

    if (username === validUser && password === validPass) {
      isValid = true;
    } else {
      // Check secondary admins
      const ADMINS_FILE = process.env.VERCEL ? '/tmp/data/admins.json' : path.join(process.cwd(), 'tmp', 'data', 'admins.json');
      if (existsSync(ADMINS_FILE)) {
        try {
          const admins = JSON.parse(readFileSync(ADMINS_FILE, 'utf8'));
          const userObj = admins.find(a => a.username === username);
          if (userObj) {
            const hash = crypto.createHash('sha256').update(password).digest('hex');
            if (hash === userObj.passwordHash) {
              isValid = true;
            }
          }
        } catch (e) {
          console.error('Failed to read admins file:', e);
        }
      }
    }

    if (!isValid) {
      await new Promise(r => setTimeout(r, 800)); // slow brute-force
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token    = makeToken(username);
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
