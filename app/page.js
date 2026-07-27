'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import UploadZone from './components/UploadZone';
import ClipConfigurator from './components/ClipConfigurator';
import ClipGrid from './components/ClipGrid';
import Footer from './components/Footer';

const ParticleBackground = dynamic(() => import('./components/ParticleBackground'), { ssr: false });

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(b) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3)   return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

/** Detect mobile/tablet */
function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && !/Win/i.test(navigator.platform));
}

/** Ping the upload API — tells us if the Next.js server (with ffmpeg) is running */
async function serverAvailable() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch('/api/upload-video', { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(t);
    return true; // any HTTP response means server is up
  } catch {
    return false;
  }
}

/** Best MIME type for MediaRecorder on this browser */
function bestMime(video = true) {
  const list = video
    ? ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4', 'video/webm;codecs="vp9,opus"', 'video/webm']
    : ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  for (const m of list) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

// ─── Engine A: Server-side FFmpeg (PC / local server) ────────────────────────
function xhrUpload(file, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { const d = JSON.parse(xhr.responseText); d.jobId ? resolve(d.jobId) : reject(new Error(d.error || 'No jobId')); }
        catch { reject(new Error('Invalid server response')); }
      } else {
        reject(new Error(`Server HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.onabort  = () => reject(new Error('cancelled'));
    if (signal) signal.addEventListener('abort', () => xhr.abort());
    xhr.open('POST', '/api/upload-video');
    xhr.send(file);
  });
}

/**
 * For custom clips: instead of uploading the entire large file, upload only
 * the slice from byte 0 → estimated end of the last clip (+ keyframe buffer).
 *
 * Works because:
 *  - The file header / moov atom is always at the start (included in slice)
 *  - FFmpeg's fast keyframe seek (-ss before -i) needs the header + the
 *    data around the requested timestamps — nothing past the last clip.
 *
 * Returns null when it's NOT worth slicing (clips too close to end of video).
 */
function buildPartialSlice(file, segments, totalDuration) {
  if (!segments.length) return null;

  const KEYFRAME_BUFFER_SECS = 120; // 2-min buffer before first clip for keyframe alignment
  const TAIL_BUFFER_SECS     = 60;  // 1-min buffer after last clip

  const maxEndTime  = Math.max(...segments.map(s => s.endTime));
  const sliceEndSec = Math.min(totalDuration, maxEndTime + TAIL_BUFFER_SECS);

  // Estimate end byte (include tail buffer)
  const sliceEndByte = Math.ceil((sliceEndSec / totalDuration) * file.size);

  // Only slice if we save at least 20% of the file — otherwise not worth it
  const savingRatio = 1 - sliceEndByte / file.size;
  if (savingRatio < 0.20) return null;

  const sliceBlob    = file.slice(0, sliceEndByte);
  const sliceSizeMB  = sliceEndByte / (1024 * 1024);
  const originalSizeMB = file.size / (1024 * 1024);
  const savedPct     = Math.round(savingRatio * 100);

  return { blob: sliceBlob, sliceSizeMB, originalSizeMB, savedPct };
}

// ─── Engine B: Browser MediaRecorder (mobile standalone, any file size) ──────
function recordOneClip(fileUrl, seg, mimeType, cancelRef) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src       = fileUrl;
    video.muted     = true;
    video.playsInline = true; // required on iOS
    video.preload   = 'auto';
    Object.assign(video.style, {
      position:'fixed', top:'-9999px', left:'-9999px',
      width:'1px', height:'1px', opacity:'0', pointerEvents:'none',
    });
    document.body.appendChild(video);

    const chunks  = [];
    let recorder  = null;

    const done = (result) => {
      try { if (recorder?.state !== 'inactive') recorder?.stop(); } catch (_) {}
      try { video.pause(); }  catch (_) {}
      try { document.body.removeChild(video); } catch (_) {}
      resolve(result);
    };
    const fail = (err) => {
      try { if (recorder?.state !== 'inactive') recorder?.stop(); } catch (_) {}
      try { video.pause(); }  catch (_) {}
      try { document.body.removeChild(video); } catch (_) {}
      reject(err);
    };

    video.addEventListener('seeked', () => {
      if (cancelRef.current) { done(null); return; }

      // Get the video's MediaStream
      const stream = video.captureStream?.() || video.mozCaptureStream?.();
      if (!stream) { fail(new Error('captureStream not supported on this browser. Try Chrome.')); return; }

      // Try high playback rate for faster processing
      try { video.playbackRate = 16; } catch (_) { video.playbackRate = 1; }

      const opts = mimeType ? { mimeType } : {};
      try { recorder = new MediaRecorder(stream, opts); }
      catch (e) { fail(new Error(`MediaRecorder: ${e.message}`)); return; }

      recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
      recorder.onstop  = () => done(new Blob(chunks, { type: mimeType || 'video/webm' }));
      recorder.onerror = (e) => fail(e.error || new Error('MediaRecorder error'));

      recorder.start(100);
      video.play().catch(fail);

      // Stop when clip duration elapsed (adjusted for playback rate)
      const ms = ((seg.duration / (video.playbackRate || 1)) * 1000) + 800;
      setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, ms);

    }, { once: true });

    video.onerror = () => fail(new Error('Failed to load video for processing'));
    video.currentTime = seg.startTime; // triggers seeked
  });
}

async function runMediaRecorder(file, segments, isMp3, cancelRef, onProgress, onStatus) {
  const fileUrl  = URL.createObjectURL(file);
  const mime     = bestMime(!isMp3);
  const ext      = isMp3 ? 'webm' : (mime.includes('mp4') ? 'mp4' : 'webm');
  const clips    = [];

  try {
    for (let i = 0; i < segments.length; i++) {
      if (cancelRef.current) break;
      const seg = segments[i];
      const estSec = Math.max(1, Math.round(seg.duration / 16));
      onStatus(`📂 Clip ${i + 1} of ${segments.length} — extracting (~${estSec}s, no upload)…`);
      onProgress(5 + Math.round((i / segments.length) * 90));

      const blob = await recordOneClip(fileUrl, seg, isMp3 ? bestMime(false) : mime, cancelRef);
      if (!blob || cancelRef.current) break;

      clips.push({
        ...seg,
        filename: `clip_${String(i + 1).padStart(3, '0')}.${ext}`,
        url: URL.createObjectURL(blob),
        format: ext,
      });
    }
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
  return clips;
}

// ─── Engine C: FFmpeg WASM (desktop small file, no server) ───────────────────
async function runFFmpegWasm(file, segments, isMp3, cancelRef, onProgress, onStatus, ffmpegRef) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  if (!ffmpegRef.current) ffmpegRef.current = new FFmpeg();
  const ffmpeg = ffmpegRef.current;

  if (!ffmpeg.loaded) {
    onStatus('Loading FFmpeg engine…');
    const hasSAB = typeof SharedArrayBuffer !== 'undefined';
    await ffmpeg.load(hasSAB
      ? { coreURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd/ffmpeg-core.wasm',
          workerURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd/ffmpeg-core.worker.js' }
      : { coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm' });
  }

  onStatus('Loading video…');
  const CHUNK = 64 * 1024 * 1024;
  const total = Math.ceil(file.size / CHUNK);
  const parts = [];
  for (let o = 0, ci = 0; o < file.size; o += CHUNK, ci++) {
    parts.push(new Uint8Array(await file.slice(o, o + CHUNK).arrayBuffer()));
    if (total > 1) onStatus(`Reading file… ${Math.round((ci + 1) / total * 100)}%`);
  }
  const merged = new Uint8Array(parts.reduce((s, c) => s + c.byteLength, 0));
  let p = 0; for (const c of parts) { merged.set(c, p); p += c.byteLength; }
  await ffmpeg.writeFile('input.mp4', merged);

  const clips = [];
  for (let i = 0; i < segments.length; i++) {
    if (cancelRef.current) break;
    const seg = segments[i];
    const out = isMp3 ? `clip_${String(i+1).padStart(3,'0')}.mp3` : `clip_${String(i+1).padStart(3,'0')}.mp4`;
    onStatus(`⚡ Processing clip ${i + 1}/${segments.length}…`);
    onProgress(15 + Math.round((i / segments.length) * 80));

    const args = isMp3
      ? ['-ss', String(seg.startTime), '-i', 'input.mp4', '-t', String(seg.duration), '-q:a', '2', '-map', 'a', '-y', out]
      : ['-ss', String(seg.startTime), '-i', 'input.mp4', '-t', String(seg.duration), '-c:v', 'copy', '-c:a', 'copy', '-avoid_negative_ts', '1', '-y', out];

    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(out);
    clips.push({
      ...seg, filename: out,
      url: URL.createObjectURL(new Blob([data.buffer], { type: isMp3 ? 'audio/mp3' : 'video/mp4' })),
      format: isMp3 ? 'mp3' : 'mp4',
    });
    await ffmpeg.deleteFile(out);
  }
  try { await ffmpeg.deleteFile('input.mp4'); } catch (_) {}
  return clips;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Home() {
  const [videoInfo, setVideoInfo]         = useState(null);
  const [clips, setClips]                 = useState([]);
  const [totalExpected, setTotalExpected] = useState(0);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [genProgress, setGenProgress]     = useState(0);
  const [genStatus, setGenStatus]         = useState('');
  const [genEngine, setGenEngine]         = useState(''); // 'server'|'wasm'|'mediarecorder'
  const [error, setError]                 = useState('');

  const abortRef   = useRef(null);
  const cancelRef  = useRef(false);
  const ffmpegRef  = useRef(null);

  const handleUploadComplete = useCallback((info) => {
    setVideoInfo(info); setClips([]); setError('');
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.target?.tagName === 'VIDEO' || e.target?.tagName === 'AUDIO')
        document.querySelectorAll('video,audio').forEach(m => { if (m !== e.target && !m.paused) m.pause(); });
    };
    document.addEventListener('play', h, true);
    return () => document.removeEventListener('play', h, true);
  }, []);

  const handleRemove = useCallback(() => {
    setVideoInfo(null); setClips([]); setTotalExpected(0); setError('');
    setIsGenerating(false); setGenProgress(0); setGenEngine('');
  }, []);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    abortRef.current?.abort();
    if (ffmpegRef.current) { try { ffmpegRef.current.terminate(); } catch (_) {} ffmpegRef.current = null; }
    setIsGenerating(false); setGenProgress(0); setGenStatus(''); setGenEngine('');
    setTotalExpected(0);
    setError('Generation was cancelled.');
  }, []);

  const handleGenerate = useCallback(async (payload) => {
    if (!videoInfo?.file || isGenerating) return;

    const abort = new AbortController();
    abortRef.current  = abort;
    cancelRef.current = false;

    setIsGenerating(true); setGenProgress(2); setGenEngine('detecting');
    setGenStatus('Detecting best engine…'); setClips([]); setTotalExpected(0); setError('');

    // Build segments
    const segments = [];
    const dur = videoInfo.duration;
    if (payload.mode === 'custom') {
      let idx = 1;
      for (const s of payload.customSegments) {
        if (s.start >= 0 && s.end > s.start && s.start < dur) {
          segments.push({ index: idx++, startTime: s.start, duration: s.end - s.start, endTime: s.end, isRemainder: false });
        }
      }
    } else {
      const cd = payload.clipDuration; let start = 0, idx = 1;
      while (start < dur - 0.5) {
        const rem = dur - start, sd = Math.min(cd, rem);
        segments.push({ index: idx++, startTime: start, duration: sd, endTime: start + sd, isRemainder: rem < cd });
        start += sd;
      }
    }

    if (!segments.length) { setError('No valid segments.'); setIsGenerating(false); return; }

    const isMp3    = payload.format === 'mp3';
    const fileMB   = videoInfo.file.size / (1024 * 1024);
    const mobile   = isMobile();

    try {
      // ── Engine selection ─────────────────────────────────────────────────
      const hasServer = await serverAvailable();
      let engine;
      let partialSlice = null; // Used for smart partial upload

      if (hasServer) {
        if (payload.mode === 'custom' && fileMB > 300) {
          // Custom clips on a large file: avoid uploading the whole thing.
          // Try to build a partial slice (file start → end of last clip + buffer).
          partialSlice = buildPartialSlice(videoInfo.file, segments, videoInfo.duration);

          if (partialSlice) {
            // We can save ≥20% — use server with partial upload
            engine = 'server';
          } else {
            // Clips are near the end; slicing saves nothing meaningful.
            // Use MediaRecorder: reads file locally, zero upload.
            engine = 'mediarecorder';
          }
        } else {
          engine = 'server'; // Full file upload (auto-split or small file)
        }
      } else if (!mobile && fileMB <= 500) {
        engine = 'wasm';   // Desktop + small file → FFmpeg WASM
      } else {
        engine = 'mediarecorder'; // Mobile standalone or large file without server
      }

      setGenEngine(engine);

      // ════════════════════════════════════════════════════════════════════
      // ENGINE: SERVER (PC local server or cloud deployment)
      // ════════════════════════════════════════════════════════════════════
      if (engine === 'server') {
        // Determine what to upload: partial slice or full file
        const uploadBlob   = partialSlice ? partialSlice.blob : videoInfo.file;
        const uploadSizeFmt = partialSlice
          ? `${formatBytes(partialSlice.sliceSizeMB * 1024 * 1024)} (saved ${partialSlice.savedPct}% — smart clip upload)`
          : videoInfo.sizeFormatted;

        setGenStatus(partialSlice
          ? `⚡ Smart upload: ${formatBytes(partialSlice.blob.size)} of ${videoInfo.sizeFormatted}…`
          : `Uploading ${videoInfo.sizeFormatted} to server…`);
        setGenProgress(2);

        const jobId = await xhrUpload(
          uploadBlob,
          (ratio) => {
            if (cancelRef.current) return;
            setGenProgress(Math.round(ratio * 45) + 2);
            setGenStatus(`Uploading… ${formatBytes(uploadBlob.size * ratio)} / ${formatBytes(uploadBlob.size)}${
              partialSlice ? ` (smart clip — not full file)` : ''
            }`);
          },
          abort.signal
        );
        if (cancelRef.current) return;

        setGenStatus('Upload done! Native FFmpeg processing…'); setGenProgress(48);

        const res = await fetch('/api/generate-clips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId, segments, format: payload.format || 'mp4' }),
          signal: abort.signal,
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '', done = false;

        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim() || cancelRef.current) continue;
            try {
              const data = JSON.parse(line);
              if (data.error) throw new Error(data.error);

              // Update total expected count from first message
              if (typeof data.clipsTotal === 'number') setTotalExpected(data.clipsTotal);

              // ✅ Progressive: add each clip as it arrives
              if (data.clip) {
                setClips(prev => [...prev, data.clip]);
                // Scroll to clips section on first clip
                if (data.clipsReady === 1) {
                  setTimeout(() => document.querySelector('.clips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                }
              }

              if (data.status) setGenStatus(data.status);
              if (typeof data.progress === 'number') setGenProgress(48 + Math.round((data.progress / 100) * 52));

              if (data.done) {
                done = true;
                setGenProgress(100); setGenStatus('✅ All clips ready!');
                setTimeout(() => {
                  setIsGenerating(false);
                  setGenEngine(''); setGenProgress(0); setTotalExpected(0);
                }, 600);
              }
            } catch (e) { if (e.message !== 'cancelled') throw e; }
          }
        }
        if (!done && !cancelRef.current) throw new Error('Server closed connection before completing.');
        return;
      }

      // ════════════════════════════════════════════════════════════════════
      // ENGINE: FFmpeg WASM (desktop, file ≤ 500 MB, no server)
      // ════════════════════════════════════════════════════════════════════
      if (engine === 'wasm') {
        setGenStatus('Initialising FFmpeg WebAssembly…'); setGenProgress(5);
        const wasmClips = await runFFmpegWasm(
          videoInfo.file, segments, isMp3, cancelRef,
          setGenProgress, setGenStatus, ffmpegRef
        );
        if (cancelRef.current) return;
        setGenProgress(100); setGenStatus('✅ Done!');
        setTimeout(() => {
          setClips(wasmClips); setIsGenerating(false); setGenEngine(''); setGenProgress(0);
          setTimeout(() => document.querySelector('.clips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }, 600);
        return;
      }

      // ════════════════════════════════════════════════════════════════════
      // ENGINE: MediaRecorder (large custom clips / mobile — no upload needed)
      // ════════════════════════════════════════════════════════════════════
      if (engine === 'mediarecorder') {
        const isBigCustom = payload.mode === 'custom' && fileMB > 300;
        setGenStatus(
          isBigCustom
            ? `📂 Reading clips directly from your file (no upload needed)…`
            : 'Starting browser recording engine…'
        );
        setGenProgress(3);
        const mrClips = await runMediaRecorder(
          videoInfo.file, segments, isMp3, cancelRef,
          setGenProgress, setGenStatus
        );
        if (cancelRef.current) return;
        setGenProgress(100); setGenStatus('✅ Done!');
        setTimeout(() => {
          setClips(mrClips); setIsGenerating(false); setGenEngine(''); setGenProgress(0);
          setTimeout(() => document.querySelector('.clips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }, 600);
        return;
      }

    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'cancelled') return;
      console.error('[handleGenerate]', err);
      setError(err.message || 'Generation failed. Please try again.');
      setIsGenerating(false); setGenProgress(0); setGenEngine('');
    }
  }, [videoInfo, isGenerating]);

  const engineLabel = {
    server:        '⚡ Server FFmpeg — fast native processing',
    wasm:          '🔧 FFmpeg WebAssembly — in-browser, no upload',
    mediarecorder: '📂 Browser engine — reads file locally, zero upload',
    detecting:     '🔍 Auto-selecting best engine…',
  }[genEngine] || '';

  return (
    <>
      <div className="page-wrapper">
        <ParticleBackground />

        <header className="site-header">
          <a href="/" className="logo" aria-label="Akku ClipGen Home">
            <img src="/logo.png" alt="Akku ClipGen Logo" className="logo-icon" style={{ objectFit: 'cover' }} />
            <span className="logo-text">Akku ClipGen</span>
          </a>
          <nav className="header-nav">
            <a href="/" className="header-nav-link active">Home</a>
            <a href="/contact" className="header-nav-link">Contact</a>
            <a href="/admin" className="header-nav-link admin-nav-link">🛡️ Admin</a>
          </nav>
        </header>

        <main className="main-content">
          <section className="hero" aria-label="Hero section">
            <div className="hero-eyebrow"><span>🌸</span> Instant Video Splitter</div>
            <h1>Split Any Video<br />Into Perfect Clips</h1>
            <p className="hero-sub">
              Upload one long video, choose your clip length, and generate every segment
              instantly — works on PC &amp; mobile. No size limits!
            </p>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {!videoInfo ? (
            <UploadZone onUploadComplete={handleUploadComplete} />
          ) : (
            <>
              <ClipConfigurator
                videoInfo={videoInfo}
                onGenerate={handleGenerate}
                onRemove={handleRemove}
                isGenerating={isGenerating}
              />

              {isGenerating && (
                <div className="processing-section" role="status" aria-live="polite">
                  <span className="processing-icon">
                    {genEngine === 'server' ? '⚡' : genEngine === 'wasm' ? '🔧' : '📱'}
                  </span>
                  <h2 className="processing-title">{genStatus}</h2>
                  <p className="processing-sub">{engineLabel}</p>

                  {/* Live clip counter — shown once we know how many clips to expect */}
                  {totalExpected > 0 && (
                    <div className="gen-clip-counter">
                      <span className="gen-clip-ready">{clips.length}</span>
                      <span className="gen-clip-sep"> / </span>
                      <span className="gen-clip-total">{totalExpected}</span>
                      <span className="gen-clip-label">clips generated</span>
                    </div>
                  )}

                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${genProgress}%` }} />
                  </div>
                  <p className="progress-label">{Math.round(genProgress)}%</p>
                  <button
                    type="button" className="mode-btn"
                    style={{ marginTop: '20px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)', color: '#ff9999' }}
                    onClick={handleCancel}
                  >🛑 Cancel</button>
                </div>

              )}

              {/* Show clips progressively — even while still generating */}
              {clips.length > 0 && (
                <ClipGrid
                  clips={clips}
                  isGenerating={isGenerating}
                  totalExpected={totalExpected}
                />
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
