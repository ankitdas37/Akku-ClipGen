import path from 'path';
import fs   from 'fs';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  // params.path = [jobId, clipName]
  const [jobId, clipName] = params.path ?? [];

  // Security: sanitise inputs to prevent path traversal
  const safeJobId  = (jobId  || '').replace(/[^a-zA-Z0-9-]/g, '');
  const safeClip   = path.basename(clipName || '');

  const clipPath = path.join(process.cwd(), 'tmp', 'clips', safeJobId, safeClip);

  if (!safeJobId || !safeClip || !fs.existsSync(clipPath)) {
    return new Response('Not found', { status: 404 });
  }

  const stat    = fs.statSync(clipPath);
  const ext     = path.extname(safeClip).toLowerCase();
  const mime    = ext === '.mp3' ? 'audio/mpeg' : 'video/mp4';
  const fileSize = stat.size;

  // Support HTTP Range requests (required for iOS/Safari video seeking)
  const rangeHeader = request.headers.get('range');

  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fileStream = fs.createReadStream(clipPath, { start, end });
    const webStream  = new ReadableStream({
      start(controller) {
        fileStream.on('data',  (c) => controller.enqueue(c));
        fileStream.on('end',   ()  => controller.close());
        fileStream.on('error', (e) => controller.error(e));
      },
    });

    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Type':   mime,
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': String(chunkSize),
        'Content-Disposition': `attachment; filename="${safeClip}"`,
      },
    });
  }

  // Full file response
  const fileStream = fs.createReadStream(clipPath);
  const webStream  = new ReadableStream({
    start(controller) {
      fileStream.on('data',  (c) => controller.enqueue(c));
      fileStream.on('end',   ()  => controller.close());
      fileStream.on('error', (e) => controller.error(e));
    },
  });

  return new Response(webStream, {
    headers: {
      'Content-Type':   mime,
      'Content-Length': String(fileSize),
      'Accept-Ranges':  'bytes',
      'Content-Disposition': `attachment; filename="${safeClip}"`,
      'Cache-Control':  'private, max-age=3600',
    },
  });
}
