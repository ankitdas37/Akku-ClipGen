import path from 'path';
import fs   from 'fs';

export const runtime    = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/clip-audio/[jobId]/[clipName]
 *
 * Extracts audio from a stored MP4 clip using FFmpeg and returns MP3.
 * Caches the resulting MP3 alongside the clip so repeated downloads are instant.
 */
export async function GET(request, { params }) {
  const [jobId, clipName] = params.path ?? [];

  const safeJobId = (jobId  || '').replace(/[^a-zA-Z0-9-]/g, '');
  const safeClip  = path.basename(clipName || '');

  const clipPath = path.join(process.cwd(), 'tmp', 'clips', safeJobId, safeClip);

  if (!safeJobId || !safeClip || !fs.existsSync(clipPath)) {
    return new Response('Clip not found', { status: 404 });
  }

  // Derived MP3 filename (cached next to the original clip)
  const mp3Name = safeClip.replace(/\.[^.]+$/, '') + '_audio.mp3';
  const mp3Path = path.join(process.cwd(), 'tmp', 'clips', safeJobId, mp3Name);

  // Only run FFmpeg if the MP3 doesn't already exist
  if (!fs.existsSync(mp3Path)) {
    const ffmpegPath = require('ffmpeg-static');
    const { spawnSync } = require('child_process');

    const result = spawnSync(ffmpegPath, [
      '-i',   clipPath,
      '-q:a', '2',      // VBR ~190 kbps
      '-map', 'a',      // audio only
      '-y',   mp3Path,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    if (result.status !== 0 || !fs.existsSync(mp3Path)) {
      const errMsg = result.stderr?.toString?.() || 'FFmpeg failed';
      console.error('[clip-audio]', errMsg.slice(-400));
      return new Response('Audio extraction failed', { status: 500 });
    }
  }

  const stat     = fs.statSync(mp3Path);
  const fileSize = stat.size;

  // Support HTTP Range (for mobile audio player)
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(mp3Path, { start, end });
    const webStream = new ReadableStream({
      start(c) {
        fileStream.on('data',  d => c.enqueue(d));
        fileStream.on('end',   () => c.close());
        fileStream.on('error', e => c.error(e));
      },
    });
    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Type':        'audio/mpeg',
        'Content-Range':       `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':       'bytes',
        'Content-Length':      String(chunkSize),
        'Content-Disposition': `attachment; filename="${mp3Name}"`,
      },
    });
  }

  const fileStream = fs.createReadStream(mp3Path);
  const webStream = new ReadableStream({
    start(c) {
      fileStream.on('data',  d => c.enqueue(d));
      fileStream.on('end',   () => c.close());
      fileStream.on('error', e => c.error(e));
    },
  });

  return new Response(webStream, {
    headers: {
      'Content-Type':        'audio/mpeg',
      'Content-Length':      String(fileSize),
      'Accept-Ranges':       'bytes',
      'Content-Disposition': `attachment; filename="${mp3Name}"`,
      'Cache-Control':       'private, max-age=3600',
    },
  });
}
