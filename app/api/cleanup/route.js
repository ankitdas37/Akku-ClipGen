import { NextResponse } from 'next/server';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId || !/^[a-f0-9\-]{36}$/.test(jobId)) {
      return NextResponse.json({ error: 'Invalid jobId' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', jobId);
    const clipsDir  = path.join(process.cwd(), 'tmp', 'clips',   jobId);

    if (existsSync(uploadDir)) {
      await rm(uploadDir, { recursive: true, force: true });
    }
    if (existsSync(clipsDir)) {
      await rm(clipsDir,  { recursive: true, force: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Cleanup Error]', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
