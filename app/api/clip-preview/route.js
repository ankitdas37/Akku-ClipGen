import { existsSync, statSync, createReadStream, readdirSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

function convertToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate(192)
      .audioChannels(2)
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(err.message)))
      .run();
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId  = searchParams.get('jobId');
    const clip   = searchParams.get('clip');
    const format = (searchParams.get('format') || 'mp4').toLowerCase();

    if (!jobId || !/^[a-f0-9\-]{36}$/.test(jobId)) {
      return new Response('Invalid jobId', { status: 400 });
    }

    const safeClip = path.basename(clip || '');
    if (!safeClip) return new Response('Invalid clip name', { status: 400 });

    const clipsDir = path.join(process.cwd(), 'tmp', 'clips', jobId);

    // ── MP4 preview ─────────────────────────────────────────
    if (format === 'mp4') {
      const mp4Path = path.join(clipsDir, safeClip);
      if (!existsSync(mp4Path)) return new Response('Clip not found', { status: 404 });

      const stat     = statSync(mp4Path);
      const fileSize = stat.size;
      const range    = request.headers.get('range');

      const contentType = 'video/mp4';

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end   = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
        const chunkSize = end - start + 1;

        const stream    = createReadStream(mp4Path, { start, end });
        const webStream = new ReadableStream({
          start(controller) {
            stream.on('data', c => controller.enqueue(c));
            stream.on('end',  () => controller.close());
            stream.on('error', e => controller.error(e));
          },
          cancel() { stream.destroy(); },
        });

        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges':  'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type':   contentType,
            'Cache-Control':  'no-store',
          },
        });
      }

      // Full file
      const stream    = createReadStream(mp4Path);
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', c => controller.enqueue(c));
          stream.on('end',  () => controller.close());
          stream.on('error', e => controller.error(e));
        },
        cancel() { stream.destroy(); },
      });

      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Length': String(fileSize),
          'Content-Type':   contentType,
          'Accept-Ranges':  'bytes',
          'Cache-Control':  'no-store',
        },
      });
    }

    // ── MP3 preview ─────────────────────────────────────────
    if (format === 'mp3') {
      const mp4Path = path.join(clipsDir, safeClip);
      if (!existsSync(mp4Path)) return new Response('Clip not found', { status: 404 });

      const mp3Dir  = path.join(clipsDir, 'mp3');
      if (!existsSync(mp3Dir)) await mkdir(mp3Dir, { recursive: true });

      const mp3Name = safeClip.replace('.mp4', '.mp3');
      const mp3Path = path.join(mp3Dir, mp3Name);

      if (!existsSync(mp3Path)) {
        await convertToMp3(mp4Path, mp3Path);
      }

      const stat      = statSync(mp3Path);
      const fileSize  = stat.size;
      const stream    = createReadStream(mp3Path);
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', c => controller.enqueue(c));
          stream.on('end',  () => controller.close());
          stream.on('error', e => controller.error(e));
        },
        cancel() { stream.destroy(); },
      });

      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Type':   'audio/mpeg',
          'Content-Length': String(fileSize),
          'Accept-Ranges':  'bytes',
          'Cache-Control':  'no-store',
        },
      });
    }

    return new Response('Invalid format', { status: 400 });
  } catch (err) {
    console.error('[ClipPreview Error]', err);
    return new Response('Server error', { status: 500 });
  }
}
