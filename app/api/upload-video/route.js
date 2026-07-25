import path from 'path';
import fs   from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const runtime    = 'nodejs';
export const maxDuration = 300; // 5 min

export async function POST(request) {
  const jobId      = uuidv4();
  const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const inputPath  = path.join(uploadsDir, jobId);
  const fileStream = fs.createWriteStream(inputPath);

  try {
    // Stream request body directly to disk — no memory buffering
    const reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
    }

    await new Promise((resolve, reject) => {
      fileStream.end();
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    const stat = fs.statSync(inputPath);
    return Response.json({ success: true, jobId, size: stat.size });

  } catch (err) {
    console.error('[upload-video]', err);
    try { fileStream.destroy(); } catch (_) {}
    try { fs.unlinkSync(inputPath); }  catch (_) {}
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
