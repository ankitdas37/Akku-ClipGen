import { NextResponse } from 'next/server';
import { mkdir, readdir, stat, rm } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const TEN_MINUTES = 10 * 60 * 1000;

// Delete old upload and clip folders to save space
async function cleanupOldJobs() {
  try {
    const now = Date.now();
    const dirsToClean = [
      path.join(process.cwd(), 'tmp', 'uploads'),
      path.join(process.cwd(), 'tmp', 'clips')
    ];

    for (const dir of dirsToClean) {
      if (!existsSync(dir)) continue;
      const entries = await readdir(dir);
      for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        const fileStat = await stat(entryPath);
        // If folder is older than 10 minutes, delete it
        if (now - fileStat.mtimeMs > TEN_MINUTES) {
          await rm(entryPath, { recursive: true, force: true, maxRetries: 15, retryDelay: 500 }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[Auto Cleanup Error]', err);
  }
}

// Parse multipart form data manually (works in App Router)
async function parseFormData(request) {
  const formData = await request.formData();
  const file = formData.get('video');
  if (!file || typeof file === 'string') {
    throw new Error('No video file provided');
  }
  return file;
}

export async function POST(request) {
  try {
    const file = await parseFormData(request);

    // Run garbage collection in the background for stale data
    cleanupOldJobs();

    const jobId = uuidv4();
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', jobId);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Sanitize filename
    const originalName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
    const ext = path.extname(originalName) || '.mp4';
    const savedName = `original${ext}`;
    const filePath = path.join(uploadDir, savedName);

    // Stream the file directly to disk to support unlimited sizes without memory crashes
    await pipeline(
      Readable.fromWeb(file.stream()),
      createWriteStream(filePath)
    );

    return NextResponse.json({
      jobId,
      filename: file.name,
      savedName,
      size: file.size,
      duration: 0, // Will be determined client-side from the video element
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
