import { NextResponse } from 'next/server';
import { existsSync, createReadStream, statSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (chunk) => chunks.push(chunk));
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}

function convertToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate(192)        // 192kbps — high quality
      .audioChannels(2)
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`MP3 conversion error: ${err.message}`)))
      .run();
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId   = searchParams.get('jobId');
    const clip    = searchParams.get('clip');
    const format  = (searchParams.get('format') || 'mp4').toLowerCase();

    if (!jobId || !clip) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Sanitize inputs to prevent path traversal
    const safeClip = path.basename(clip);
    const clipsDir = path.join(process.cwd(), 'tmp', 'clips', jobId);
    const mp4Path  = path.join(clipsDir, safeClip);

    if (!existsSync(mp4Path)) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    if (format === 'mp4') {
      // Stream MP4 directly
      const stat = statSync(mp4Path);
      const stream = createReadStream(mp4Path);
      const buffer = await streamToBuffer(stream);

      const downloadName = safeClip;
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Content-Length': String(stat.size),
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'mp3') {
      // Convert to MP3 on the fly
      const mp3Dir = path.join(clipsDir, 'mp3');
      if (!existsSync(mp3Dir)) {
        await mkdir(mp3Dir, { recursive: true });
      }

      const mp3Name   = safeClip.replace('.mp4', '.mp3');
      const mp3Path   = path.join(mp3Dir, mp3Name);

      if (!existsSync(mp3Path)) {
        await convertToMp3(mp4Path, mp3Path);
      }

      const stat   = statSync(mp3Path);
      const stream = createReadStream(mp3Path);
      const buffer = await streamToBuffer(stream);

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${mp3Name}"`,
          'Content-Length': String(stat.size),
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use mp4 or mp3.' }, { status: 400 });
  } catch (err) {
    console.error('[Download Error]', err);
    return NextResponse.json(
      { error: err.message || 'Download failed' },
      { status: 500 }
    );
  }
}
