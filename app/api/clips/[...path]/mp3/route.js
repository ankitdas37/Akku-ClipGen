import path from 'path';
import fs   from 'fs';

export const runtime    = 'nodejs';
export const maxDuration = 60;

export async function GET(request, { params }) {
  // params.path = [jobId, clipName] — the original MP4 filename
  const [jobId, clipName] = params.path ?? [];

  const safeJobId = (jobId  || '').replace(/[^a-zA-Z0-9-]/g, '');
  const safeClip  = path.basename(clipName || '');

  const clipPath = path.join(process.cwd(), 'tmp', 'clips', safeJobId, safeClip);

  if (!safeJobId || !safeClip || !fs.existsSync(clipPath)) {
    return new Response('Clip not found', { status: 404 });
  }

  // Output MP3 filename
  const mp3Name    = safeClip.replace(/\.[^.]+$/, '') + '.mp3';
  const mp3Path    = path.join(process.cwd(), 'tmp', 'clips', safeJobId, mp3Name);

  // Only run FFmpeg if the MP3 doesn't already exist (cache it)
  if (!fs.existsSync(mp3Path)) {
    const ffmpegPath = require('ffmpeg-static');
    const { spawnSync } = require('child_process');

    const result = spawnSync(ffmpegPath, [
      '-i',   clipPath,
      '-q:a', '2',      // VBR quality ~190 kbps
      '-map', 'a',      // audio stream only
      '-y',   mp3Path,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    if (result.status !== 0 || !fs.existsSync(mp3Path)) {
      const err = result.stderr?.toString?.() || 'FFmpeg failed';
      console.error('[clip-to-mp3]', err.slice(-400));
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
