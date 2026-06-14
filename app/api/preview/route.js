import { existsSync, readdirSync, statSync, createReadStream } from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId || !/^[a-f0-9\-]{36}$/.test(jobId)) {
      return new Response('Invalid jobId', { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', jobId);
    if (!existsSync(uploadDir)) {
      return new Response('File not found', { status: 404 });
    }

    // Find the original file
    const files = readdirSync(uploadDir);
    const original = files.find(f => f.startsWith('original'));
    if (!original) {
      return new Response('File not found', { status: 404 });
    }

    const filePath = path.join(uploadDir, original);
    const ext = path.extname(original).toLowerCase();

    const mimeMap = {
      '.mp4':  'video/mp4',
      '.webm': 'video/webm',
      '.avi':  'video/x-msvideo',
      '.mov':  'video/quicktime',
      '.mkv':  'video/x-matroska',
      '.mpeg': 'video/mpeg',
      '.mpg':  'video/mpeg',
      '.m4v':  'video/mp4',
      '.ogv':  'video/ogg',
      '.3gp':  'video/3gpp',
      '.flv':  'video/x-flv',
      '.wmv':  'video/x-ms-wmv',
    };
    const contentType = mimeMap[ext] || 'video/mp4';

    const stat = statSync(filePath);
    const fileSize = stat.size;
    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      // Parse Range header (e.g. "bytes=0-1023")
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      const stream = createReadStream(filePath, { start, end });

      // Convert Node.js stream to Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
        cancel() {
          stream.destroy();
        },
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

    // No range — return full file
    const stream = createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
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
  } catch (err) {
    console.error('[Preview Error]', err);
    return new Response('Server error', { status: 500 });
  }
}
