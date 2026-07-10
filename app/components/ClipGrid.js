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

// ── Inline Player ────────────────────────────────────────────────────────
function ClipInlinePlayer({ clip }) {
  const isMp3 = clip.format === 'mp3';
  return (
    <div className="clip-inline-player">
      {isMp3 ? (
        <audio
          id={`clip-audio-${clip.index}`}
          className="clip-audio-player"
          src={clip.url}
          controls
          controlsList="nodownload"
          preload="metadata"
          style={{ width: '100%', outline: 'none', borderRadius: '8px', marginTop: '10px' }}
        >
          Your browser does not support the audio tag.
        </audio>
      ) : (
        <video
          id={`clip-video-${clip.index}`}
          className="clip-video-player"
          src={clip.url}
          controls
          controlsList="nodownload"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}

// ── Individual Clip Card ────────────────────────────────────────────────
function ClipCard({ clip, index }) {
  const [showPlayer, setShowPlayer] = useState(false);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = clip.url;
    a.download = clip.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [clip]);

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
      <div className="clip-duration-display">
        {formatDuration(clip.duration)}
      </div>
      <div className="clip-timestamp">
        {formatTimestamp(clip.startTime)} → {formatTimestamp(clip.endTime)}
      </div>

      {/* Download buttons */}
      <div className="clip-actions">
        <button
          id={`dl-${clip.format}-${clip.index}`}
          type="button"
          className="clip-dl-btn mp4"
          onClick={handleDownload}
          title={`Download Clip ${clip.index} as ${clip.format === 'mp3' ? 'MP3' : 'MP4'}`}
        >
          ⬇️ {clip.format === 'mp3' ? 'MP3' : 'MP4'}
        </button>
      </div>

      {/* Preview toggle */}
      <button
        id={`preview-toggle-${clip.index}`}
        type="button"
        className={`clip-preview-toggle${showPlayer ? ' active' : ''}`}
        onClick={() => setShowPlayer(v => !v)}
      >
        {showPlayer ? '▲ Hide Preview' : '▶ Preview Clip'}
      </button>

      {/* Inline player (video + audio tabs) */}
      {showPlayer && (
        <ClipInlinePlayer clip={clip} />
      )}
    </div>
  );
}

// ── Grid ────────────────────────────────────────────────────────────────
export default function ClipGrid({ clips }) {

  const handleBulkDownload = useCallback(async () => {
    for (const clip of clips) {
      const a = document.createElement('a');
      a.href = clip.url;
      a.download = clip.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise(r => setTimeout(r, 800)); // slight delay between downloads
    }
  }, [clips]);

  if (!clips || clips.length === 0) return null;

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
          >
            ⬇️ Download All
          </button>
        </div>
      </div>

      <div className="clips-grid">
        {clips.map((clip, i) => (
          <ClipCard
            key={clip.filename}
            clip={clip}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
