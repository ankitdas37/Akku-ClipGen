import path from 'path';
import fs   from 'fs';

export const runtime    = 'nodejs';
export const maxDuration = 300; // 5 min

function formatBytes(b) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3)   return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

/** Delete clip folders older than 2 hours to reclaim disk space automatically */
function cleanOldClips() {
  try {
    const clipsRoot = path.join(process.cwd(), 'tmp', 'clips');
    if (!fs.existsSync(clipsRoot)) return;
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    for (const entry of fs.readdirSync(clipsRoot)) {
      const dir = path.join(clipsRoot, entry);
      try {
        const stat = fs.statSync(dir);
        if (stat.isDirectory() && now - stat.mtimeMs > TWO_HOURS) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch (_) {}
    }
  } catch (_) {}
}

export async function POST(request) {
  let jobId, segments, format;

  try {
    const body = await request.json();
    jobId    = body.jobId;
    segments = body.segments;
    format   = body.format || 'mp4';
  } catch (_) {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Clean up stale clip folders (>2 h old) to prevent disk filling
  cleanOldClips();

  const isMp3     = format === 'mp3';
  const inputPath = path.join(process.cwd(), 'tmp', 'uploads', jobId);
  const clipsDir  = path.join(process.cwd(), 'tmp', 'clips', jobId);

  if (!jobId || !fs.existsSync(inputPath)) {
    return Response.json({ error: 'Uploaded file not found. Please re-upload the video.' }, { status: 404 });
  }

  fs.mkdirSync(clipsDir, { recursive: true });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n')); } catch (_) {}
      };

      try {
        const ffmpegPath = require('ffmpeg-static');
        const { spawn }  = require('child_process');

        const total = segments.length;
        let completed = 0;
        let index = 0;
        const CONCURRENCY_LIMIT = 8; // Run 8 FFmpeg processes in parallel

        // Send initial status so client knows total clip count immediately
        send({ status: `⚡ Starting ${total} clips…`, progress: 5, clipsTotal: total, clipsReady: 0 });

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
                    '-y',  outputPath,
                  ]
                : [
                    '-ss', String(seg.startTime),
                    '-i',  inputPath,
                    '-t',  String(seg.duration),
                    '-c:v', 'copy',
                    '-c:a', 'copy',
                    '-avoid_negative_ts', '1',
                    '-movflags', '+faststart',
                    '-y',  outputPath,
                  ];

              const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
              let errBuf = '';
              proc.stderr.on('data', (d) => { errBuf += d.toString(); });
              proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg clip ${i + 1} failed (exit ${code}): ${errBuf.slice(-400)}`));
              });
              proc.on('error', reject);
            });

            let fileSize = 0;
            try { fileSize = fs.statSync(outputPath).size; } catch (_) {}

            completed++;

            const clipMeta = {
              index:         seg.index,
              startTime:     seg.startTime,
              endTime:       seg.endTime,
              duration:      seg.duration,
              isRemainder:   seg.isRemainder || false,
              filename:      outputFilename,
              sizeFormatted: formatBytes(fileSize),
              url:           `/api/clips/${jobId}/${outputFilename}`,
              format:        ext,
            };

            // ✅ Stream this clip immediately — client can download it right now!
            send({
              clip:       clipMeta,
              clipsReady: completed,
              clipsTotal: total,
              status:     `⚡ ${completed} of ${total} clips ready…`,
              progress:   5 + Math.round((completed / total) * 90),
            });
          }
        };

        // Spawn N parallel workers
        const workers = [];
        for (let w = 0; w < Math.min(CONCURRENCY_LIMIT, segments.length); w++) {
          workers.push(processNext());
        }
        await Promise.all(workers);

        // Delete uploaded source file — clips are ready
        try { fs.unlinkSync(inputPath); } catch (_) {}

        send({ done: true, progress: 100, status: '✅ All clips ready!' });

      } catch (err) {
        console.error('[generate-clips]', err);
        send({ error: err.message || 'Clip generation failed.' });
        try { fs.unlinkSync(inputPath); } catch (_) {}
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':      'application/x-ndjson',
      'Cache-Control':     'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
