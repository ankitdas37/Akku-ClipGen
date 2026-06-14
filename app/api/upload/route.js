import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({
      jobId,
      filename: file.name,
      savedName,
      size: buffer.length,
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
