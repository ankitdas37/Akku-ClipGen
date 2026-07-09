import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

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

    // Send Email Notification (in the background)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 465,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"${name}" <${process.env.SMTP_USER}>`, // Send via authenticated user
        replyTo: email,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `[Akku ClipGen] New Message: ${newMsg.subject}`,
        text: `You have received a new message/bug report from ${name} (${email}).\n\nSubject: ${newMsg.subject}\n\nMessage:\n${newMsg.message}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #fdf2f8; border-radius: 10px;">
            <h2 style="color: #ff69b4;">✨ New Message / Bug Report ✨</h2>
            <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
            <p><strong>Subject:</strong> ${newMsg.subject}</p>
            <hr style="border: 1px solid #fbcfe8; margin: 20px 0;">
            <p style="white-space: pre-wrap; font-size: 16px;">${newMsg.message}</p>
          </div>
        `,
      };

      // Don't await, let it send in the background
      transporter.sendMail(mailOptions).catch(err => {
        console.error('[Nodemailer Error]', err);
      });
    }

    return Response.json({ success: true, id: newMsg.id }, { status: 201 });
  } catch (err) {
    console.error('[Messages POST]', err);
    return Response.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
