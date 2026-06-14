'use client';
import { useState, useCallback, useRef } from 'react';

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

// ── Inline Player (video + audio tabs) ─────────────────────────────────
function ClipInlinePlayer({ clip, jobId }) {
  const [activeTab, setActiveTab]   = useState('mp4');   // 'mp4' | 'mp3'
  const [mp3Ready, setMp3Ready]     = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);
  const audioRef = useRef(null);

  const mp4Src = `/api/clip-preview?jobId=${encodeURIComponent(jobId)}&clip=${encodeURIComponent(clip.filename)}&format=mp4`;
  const mp3Src = `/api/clip-preview?jobId=${encodeURIComponent(jobId)}&clip=${encodeURIComponent(clip.filename)}&format=mp3`;

  const switchToMp3 = useCallback(async () => {
    setActiveTab('mp3');
    if (!mp3Ready) {
      setMp3Loading(true);
      // The audio element will trigger the MP3 conversion via the API when it loads
      // We just need to set the src and let it load
    }
  }, [mp3Ready]);

  return (
    <div className="clip-inline-player">
      {/* Tab switcher */}
      <div className="clip-player-tabs">
        <button
          type="button"
          className={`clip-tab-btn tab-mp4${activeTab === 'mp4' ? ' active' : ''}`}
          onClick={() => setActiveTab('mp4')}
          id={`tab-mp4-${clip.index}`}
        >
          🎬 VIDEO
        </button>
        <button
          type="button"
          className={`clip-tab-btn tab-mp3${activeTab === 'mp3' ? ' active' : ''}`}
          onClick={switchToMp3}
          id={`tab-mp3-${clip.index}`}
        >
          🎵 AUDIO
        </button>
      </div>

      {/* MP4 Video Player */}
      {activeTab === 'mp4' && (
        <video
          id={`clip-video-${clip.index}`}
          className="clip-video-player"
          src={mp4Src}
          controls
          controlsList="nodownload"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* MP3 Audio Player */}
      {activeTab === 'mp3' && (
        <div className="clip-audio-wrap">
          {mp3Loading && !mp3Ready && (
            <div style={{ position: 'absolute', display: 'none' }} />
          )}
          <div className="clip-audio-art">🎵</div>
          <div className="clip-audio-label">Clip {String(clip.index).padStart(2, '0')} · Audio Track</div>
          <audio
            ref={audioRef}
            id={`clip-audio-${clip.index}`}
            className="clip-audio-player"
            src={mp3Src}
            controls
            controlsList="nodownload"
            preload="metadata"
            onLoadStart={() => setMp3Loading(true)}
            onCanPlay={() => { setMp3Loading(false); setMp3Ready(true); }}
            onError={() => setMp3Loading(false)}
          />
          {mp3Loading && (
            <div className="clip-player-loading">
              <span className="clip-player-loading-icon">⚙️</span>
              <span>Converting to MP3…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Individual Clip Card ────────────────────────────────────────────────
function ClipCard({ clip, jobId, index }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [mp4Loading, setMp4Loading] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);

  const handleDownload = useCallback(async (format) => {
    const setLoading = format === 'mp4' ? setMp4Loading : setMp3Loading;
    setLoading(true);
    try {
      const url = `/api/download?jobId=${encodeURIComponent(jobId)}&clip=${encodeURIComponent(clip.filename)}&format=${format}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = clip.filename.replace('.mp4', `.${format}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise(r => setTimeout(r, 1500));
    } finally {
      setLoading(false);
    }
  }, [clip, jobId]);

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
          id={`dl-mp4-${clip.index}`}
          type="button"
          className={`clip-dl-btn mp4${mp4Loading ? ' loading' : ''}`}
          onClick={() => handleDownload('mp4')}
          disabled={mp4Loading || mp3Loading}
          title={`Download Clip ${clip.index} as MP4`}
        >
          {mp4Loading ? '⏳' : '⬇️'} MP4
        </button>
        <button
          id={`dl-mp3-${clip.index}`}
          type="button"
          className={`clip-dl-btn mp3${mp3Loading ? ' loading' : ''}`}
          onClick={() => handleDownload('mp3')}
          disabled={mp4Loading || mp3Loading}
          title={`Download Clip ${clip.index} as MP3`}
        >
          {mp3Loading ? '⏳' : '🎵'} MP3
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
        <ClipInlinePlayer clip={clip} jobId={jobId} />
      )}
    </div>
  );
}

// ── Grid ────────────────────────────────────────────────────────────────
export default function ClipGrid({ clips, jobId }) {
  const [bulkMp4Loading, setBulkMp4Loading] = useState(false);
  const [bulkMp3Loading, setBulkMp3Loading] = useState(false);

  const handleBulkDownload = useCallback(async (format) => {
    const setLoading = format === 'mp4' ? setBulkMp4Loading : setBulkMp3Loading;
    setLoading(true);
    try {
      for (const clip of clips) {
        const url = `/api/download?jobId=${encodeURIComponent(jobId)}&clip=${encodeURIComponent(clip.filename)}&format=${format}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = clip.filename.replace('.mp4', `.${format}`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise(r => setTimeout(r, 800));
      }
    } finally {
      setLoading(false);
    }
  }, [clips, jobId]);

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
            id="bulk-download-mp4"
            type="button"
            className="bulk-btn mp4"
            onClick={() => handleBulkDownload('mp4')}
            disabled={bulkMp4Loading || bulkMp3Loading}
          >
            {bulkMp4Loading ? '⏳' : '⬇️'} Download All MP4
          </button>
          <button
            id="bulk-download-mp3"
            type="button"
            className="bulk-btn mp3"
            onClick={() => handleBulkDownload('mp3')}
            disabled={bulkMp4Loading || bulkMp3Loading}
          >
            {bulkMp3Loading ? '⏳' : '🎵'} Download All MP3
          </button>
        </div>
      </div>

      <div className="clips-grid">
        {clips.map((clip, i) => (
          <ClipCard
            key={clip.filename}
            clip={clip}
            jobId={jobId}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
