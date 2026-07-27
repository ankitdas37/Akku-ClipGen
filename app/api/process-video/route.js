import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const runtime  = 'nodejs';
export const maxDuration = 300; // 5 minutes max

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatBytes(b) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3)   return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const segments = JSON.parse(decodeURIComponent(searchParams.get('segments') || '[]'));
  const format   = searchParams.get('format') || 'mp4';
  const isMp3    = format === 'mp3';

  const jobId    = uuidv4();
  const tmpRoot  = path.join(process.cwd(), 'tmp');
  const inputPath = path.join(tmpRoot, `${jobId}_input`);
  const clipsDir  = path.join(tmpRoot, 'clips', jobId);

  ensureDir(tmpRoot);
  ensureDir(clipsDir);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n')); } catch (_) {}
      };

      try {
        // ── Phase 1: Stream upload to disk ──────────────────────────────────
        send({ status: 'Receiving video…', progress: 2 });

        const fileStream = fs.createWriteStream(inputPath);
        let bytesWritten = 0;
        const reader = request.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fileStream.write(value);
          bytesWritten += value.byteLength;
        }

        await new Promise((resolve, reject) => {
          fileStream.end();
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });

        send({ status: `File received (${formatBytes(bytesWritten)}). Starting FFmpeg…`, progress: 15 });

        // ── Phase 2: Run native FFmpeg per segment ───────────────────────────
        const ffmpegPath = require('ffmpeg-static');
        const { spawn }  = require('child_process');

        const generatedClips = new Array(segments.length);
        let completed = 0;
        let index = 0;
        const CONCURRENCY_LIMIT = 5;

        const processNext = async () => {
          while (index < segments.length) {
            const i = index++;
            const seg = segments[i];
            const ext = isMp3 ? 'mp3' : 'mp4';
            const outputFilename = `clip_${String(i + 1).padStart(3, '0')}.${ext}`;
            const outputPath     = path.join(clipsDir, outputFilename);

            await new Promise((resolve, reject) => {
              const args = isMp3
                ? [
                    '-ss', String(seg.startTime),
                    '-i',  inputPath,
                    '-t',  String(seg.duration),
                    '-q:a', '2',
                    '-map', 'a',
                    '-y',   outputPath,
                  ]
                : [
                    '-ss', String(seg.startTime),
                    '-i',  inputPath,
                    '-t',  String(seg.duration),
                    '-c:v', 'copy',
                    '-c:a', 'copy',
                    '-avoid_negative_ts', '1',
                    '-movflags', '+faststart',
                    '-y', outputPath,
                  ];

              const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
              let errBuf = '';
              proc.stderr.on('data', (d) => { errBuf += d.toString(); });
              proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg clip ${i + 1} failed (code ${code}): ${errBuf.slice(-400)}`));
              });
              proc.on('error', reject);
            });

            let fileSize = 0;
            try { fileSize = fs.statSync(outputPath).size; } catch (_) {}

            generatedClips[i] = {
              index:       seg.index,
              startTime:   seg.startTime,
              endTime:     seg.endTime,
              duration:    seg.duration,
              isRemainder: seg.isRemainder || false,
              filename:    outputFilename,
              sizeFormatted: formatBytes(fileSize),
              url:         `/api/clips/${jobId}/${outputFilename}`,
              format:      ext,
            };

            completed++;
            const pct = 15 + Math.round((completed / segments.length) * 80);
            send({ status: `Processing clip ${completed} of ${segments.length}…`, progress: pct });
          }
        };

        const workers = [];
        for (let w = 0; w < Math.min(CONCURRENCY_LIMIT, segments.length); w++) {
          workers.push(processNext());
        }
        await Promise.all(workers);

        // Cleanup uploaded input (clips remain until downloaded / TTL cleanup)
        try { fs.unlinkSync(inputPath); } catch (_) {}

        send({ done: true, clips: generatedClips, progress: 100, status: 'Done!' });

      } catch (err) {
        console.error('[process-video]', err);
        send({ error: err.message || 'Processing failed.' });
        // Cleanup on error
        try { fs.unlinkSync(inputPath); } catch (_) {}
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
