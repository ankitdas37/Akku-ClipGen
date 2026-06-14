import { NextResponse } from 'next/server';
import { existsSync, readdirSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Point fluent-ffmpeg at the bundled static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

function findOriginalFile(uploadDir) {
  if (!existsSync(uploadDir)) return null;
  const files = readdirSync(uploadDir);
  const original = files.find(f => f.startsWith('original'));
  return original ? path.join(uploadDir, original) : null;
}

function splitVideo(inputPath, outputPath, startTime, duration) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c:v copy',   // copy video stream — no re-encode, fastest
        '-c:a copy',   // copy audio stream — zero quality loss
        '-avoid_negative_ts make_zero',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`ffmpeg error: ${err.message}`)))
      .run();
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { jobId, clipDuration, totalDuration } = body;

    if (!jobId || !clipDuration || clipDuration <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads', jobId);
    const inputPath = findOriginalFile(uploadDir);

    if (!inputPath) {
      return NextResponse.json({ error: 'Video file not found. Please re-upload.' }, { status: 404 });
    }

    const clipsDir = path.join(process.cwd(), 'tmp', 'clips', jobId);
    if (!existsSync(clipsDir)) {
      await mkdir(clipsDir, { recursive: true });
    }

    // Calculate clip segments
    const duration = totalDuration > 0 ? totalDuration : await getVideoDuration(inputPath);
    const segments = [];
    let startTime = 0;
    let clipIndex = 1;

    while (startTime < duration - 0.5) {
      const remaining = duration - startTime;
      const segDuration = Math.min(clipDuration, remaining);
      const filename = `clip_${String(clipIndex).padStart(3, '0')}.mp4`;
      segments.push({
        index: clipIndex,
        startTime,
        duration: segDuration,
        endTime: startTime + segDuration,
        filename,
        isRemainder: remaining < clipDuration,
      });
      startTime += segDuration;
      clipIndex++;
    }

    // Process all clips sequentially to avoid memory issues
    for (const seg of segments) {
      const outputPath = path.join(clipsDir, seg.filename);
      await splitVideo(inputPath, outputPath, seg.startTime, seg.duration);
    }

    return NextResponse.json({ clips: segments });
  } catch (err) {
    console.error('[Generate Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate clips' },
      { status: 500 }
    );
  }
}

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata?.format?.duration || 0);
    });
  });
}
