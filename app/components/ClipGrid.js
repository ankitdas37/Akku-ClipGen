'use client';
import { useState, useCallback } from 'react';

function formatDuration(secs) {
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatTimestamp(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Universal save function — works on PC, Android, and iOS.
 *
 * Priority:
 *  1. Web Share API with file  → iOS 15+, Android Chrome, Desktop Chrome  (best UX on mobile)
 *  2. Anchor <a download>      → Desktop browsers, Android  (fast, no fetch needed)
 *  3. Open in new tab          → Fallback for browsers that block both above
 */
async function saveClip(url, filename, mimeType, onStatus) {
  // ── Try Web Share API (best on mobile / iOS) ─────────────────────────────
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      onStatus('loading');
      const res   = await fetch(url);
      const blob  = await res.blob();
      const file  = new File([blob], filename, { type: mimeType });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        onStatus('done');
        return;
      }
    } catch (err) {
      // User cancelled share or Web Share failed — fall through to next method
      if (err.name === 'AbortError') { onStatus('done'); return; }
    }
  }

  // ── Anchor download (desktop + Android Chrome) ────────────────────────────
  if (!isIOS()) {
    try {
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.target   = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onStatus('done');
      return;
    } catch (_) {}
  }

  // ── iOS fallback: fetch → blob URL → anchor ───────────────────────────────
  // The download attribute is ignored on iOS Safari, but opening the blob
  // URL in a new tab lets users long-press → "Save to Files / Photos"
  try {
    onStatus('loading');
    const res     = await fetch(url);
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    onStatus('open');   // show "tap & hold → Save" tip
  } catch (_) {
    // Last resort
    window.open(url, '_blank');
    onStatus('open');
  }
}

// ── Inline Player ────────────────────────────────────────────────────────────
function ClipInlinePlayer({ clip }) {
  const isMp3 = clip.format === 'mp3' || clip.format === 'webm';
  const src   = clip.url;
  return (
    <div className="clip-inline-player">
      {isMp3 ? (
        <audio
          id={`clip-audio-${clip.index}`}
          className="clip-audio-player"
          src={src}
          controls
          preload="metadata"
          style={{ width: '100%', outline: 'none', borderRadius: '8px', marginTop: '10px' }}
        >
          Your browser does not support audio.
        </audio>
      ) : (
        <video
          id={`clip-video-${clip.index}`}
          className="clip-video-player"
          src={src}
          controls
          playsInline
          preload="metadata"
        >
          Your browser does not support video.
        </video>
      )}
    </div>
  );
}

// ── Individual Clip Card ──────────────────────────────────────────────────────
function ClipCard({ clip, index }) {
  const [showPlayer,   setShowPlayer]   = useState(false);
  const [dlState,      setDlState]      = useState('idle'); // idle|loading|done|open

  const mime = clip.format === 'mp3' ? 'audio/mpeg'
             : clip.format === 'webm' ? 'video/webm'
             : 'video/mp4';

  const handleDownload = useCallback(async () => {
    if (dlState === 'loading') return;
    await saveClip(clip.url, clip.filename, mime, setDlState);
  }, [clip, mime, dlState]);

  const dlLabel = dlState === 'loading' ? '⏳ Saving…'
                : dlState === 'done'    ? '✅ Saved!'
                : dlState === 'open'    ? '👆 Long-press → Save'
                : `⬇️ ${(clip.format || 'mp4').toUpperCase()}`;

  return (
    <div
      className="clip-card"
      style={{ animationDelay: `${index * 0.06}s` }}
      id={`clip-card-${clip.index}`}
    >
      {/* Card header */}
      <div className="clip-card-header">
        <span className="clip-number">CLIP {String(clip.index).padStart(2, '0')}</span>
        {clip.isRemainder && (
          <span className="clip-remainder-badge">⭐ REMAINDER</span>
        )}
      </div>

      {/* Duration & timestamp */}
      <div className="clip-duration-display">{formatDuration(clip.duration)}</div>
      <div className="clip-timestamp">
        {formatTimestamp(clip.startTime)} → {formatTimestamp(clip.endTime)}
      </div>

      {/* Download button */}
      <div className="clip-actions">
        <button
          id={`dl-${clip.format}-${clip.index}`}
          type="button"
          className="clip-dl-btn mp4"
          onClick={handleDownload}
          disabled={dlState === 'loading'}
          title={`Save Clip ${clip.index}`}
        >
          {dlLabel}
        </button>
      </div>

      {/* iOS "open in new tab" hint */}
      {dlState === 'open' && (
        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', textAlign: 'center' }}>
          Tap &amp; hold the video → <strong>Save to Files</strong> or <strong>Save to Photos</strong>
        </p>
      )}

      {/* Preview toggle */}
      <button
        id={`preview-toggle-${clip.index}`}
        type="button"
        className={`clip-preview-toggle${showPlayer ? ' active' : ''}`}
        onClick={() => setShowPlayer(v => !v)}
      >
        {showPlayer ? '▲ Hide Preview' : '▶ Preview Clip'}
      </button>

      {showPlayer && <ClipInlinePlayer clip={clip} />}
    </div>
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────
export default function ClipGrid({ clips }) {
  const [bulkState, setBulkState] = useState('idle');

  const handleBulkDownload = useCallback(async () => {
    if (bulkState === 'loading') return;
    setBulkState('loading');

    for (const clip of clips) {
      const mime = clip.format === 'mp3' ? 'audio/mpeg'
                 : clip.format === 'webm' ? 'video/webm'
                 : 'video/mp4';
      await saveClip(clip.url, clip.filename, mime, () => {});
      await new Promise(r => setTimeout(r, 600));
    }
    setBulkState('done');
    setTimeout(() => setBulkState('idle'), 3000);
  }, [clips, bulkState]);

  if (!clips?.length) return null;

  return (
    <div className="clips-section">
      <div className="clips-header">
        <div className="clips-title">
          <span>🎌</span>
          Generated Clips
          <span className="clips-count-badge">{clips.length} clips</span>
        </div>
        <div className="bulk-actions">
          <button
            id="bulk-download-media"
            type="button"
            className="bulk-btn mp4"
            onClick={handleBulkDownload}
            disabled={bulkState === 'loading'}
          >
            {bulkState === 'loading' ? '⏳ Saving…'
           : bulkState === 'done'    ? '✅ Done!'
           : '⬇️ Download All'}
          </button>
        </div>
      </div>

      <div className="clips-grid">
        {clips.map((clip, i) => (
          <ClipCard key={clip.filename || i} clip={clip} index={i} />
        ))}
      </div>
    </div>
  );
}
