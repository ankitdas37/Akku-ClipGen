import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'tmp', 'data');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

function ensureFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(ADMINS_FILE)) writeFileSync(ADMINS_FILE, '[]', 'utf8');
}

function readAdmins() {
  ensureFile();
  try { return JSON.parse(readFileSync(ADMINS_FILE, 'utf8')); }
  catch { return []; }
}

function writeAdmins(admins) {
  ensureFile();
  writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), 'utf8');
}

export async function GET() {
  try {
    const admins = readAdmins();
    // Return admins without password hashes
    const safeAdmins = admins.map(a => ({
      username: a.username,
      createdAt: a.createdAt
    }));
    return NextResponse.json({ admins: safeAdmins });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load admins' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    
    // Check against root admin
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    if (trimmedUsername === validUser) {
      return NextResponse.json({ error: 'Cannot recreate the root admin' }, { status: 400 });
    }

    const admins = readAdmins();
    
    // Check if user already exists
    if (admins.find(a => a.username === trimmedUsername)) {
      return NextResponse.json({ error: 'Admin user already exists' }, { status: 400 });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const newAdmin = {
      username: trimmedUsername,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    writeAdmins(admins);

    return NextResponse.json({ success: true, username: newAdmin.username }, { status: 201 });
  } catch (err) {
    console.error('[Admin Users POST]', err);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
