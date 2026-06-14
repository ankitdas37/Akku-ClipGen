import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'tmp', 'data');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');

function readMessages() {
  if (!existsSync(MSG_FILE)) return [];
  try { return JSON.parse(readFileSync(MSG_FILE, 'utf8')); }
  catch { return []; }
}

function writeMessages(msgs) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2), 'utf8');
}

// ── POST /api/messages/reply — add reply to a message ──────────────────
export async function POST(request) {
  try {
    const { messageId, replyText } = await request.json();

    if (!messageId || !replyText?.trim()) {
      return Response.json({ error: 'messageId and replyText are required' }, { status: 400 });
    }

    const msgs  = readMessages();
    const index = msgs.findIndex(m => m.id === messageId);

    if (index === -1) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    const reply = {
      text:      replyText.trim(),
      repliedAt: new Date().toISOString(),
    };

    msgs[index].replies = [...(msgs[index].replies || []), reply];
    msgs[index].read    = true;
    writeMessages(msgs);

    return Response.json({ success: true, reply });
  } catch (err) {
    console.error('[Reply POST]', err);
    return Response.json({ error: 'Failed to save reply' }, { status: 500 });
  }
}

// ── PATCH /api/messages/reply — mark message as read ───────────────────
export async function PATCH(request) {
  try {
    const { messageId } = await request.json();
    const msgs  = readMessages();
    const index = msgs.findIndex(m => m.id === messageId);
    if (index !== -1) {
      msgs[index].read = true;
      writeMessages(msgs);
    }
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
