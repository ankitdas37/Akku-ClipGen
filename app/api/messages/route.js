import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR  = path.join(process.cwd(), 'tmp', 'data');
const MSG_FILE  = path.join(DATA_DIR, 'messages.json');

function ensureFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(MSG_FILE)) writeFileSync(MSG_FILE, '[]', 'utf8');
}

function readMessages() {
  ensureFile();
  try { return JSON.parse(readFileSync(MSG_FILE, 'utf8')); }
  catch { return []; }
}

function writeMessages(msgs) {
  ensureFile();
  writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2), 'utf8');
}

// ── GET /api/messages — list all messages ──────────────────────────────
export async function GET() {
  try {
    const msgs = readMessages();
    // Sort newest first
    msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return Response.json({ messages: msgs });
  } catch (err) {
    return Response.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

// ── POST /api/messages — save new contact message ──────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const newMsg = {
      id:        uuidv4(),
      name:      name.trim(),
      email:     email.trim(),
      subject:   subject?.trim() || '(No subject)',
      message:   message.trim(),
      createdAt: new Date().toISOString(),
      read:      false,
      replies:   [],
    };

    const msgs = readMessages();
    msgs.push(newMsg);
    writeMessages(msgs);

    return Response.json({ success: true, id: newMsg.id }, { status: 201 });
  } catch (err) {
    console.error('[Messages POST]', err);
    return Response.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
