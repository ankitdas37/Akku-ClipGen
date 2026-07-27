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

/** Convert AudioBuffer → WAV Blob (for client-side audio extraction fallback) */
function audioBufferToWav(buffer) {
  const numCh   = buffer.numberOfChannels;
  const rate    = buffer.sampleRate;
  const samples = buffer.length;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numCh * bytesPerSample;
  const dataSize  = samples * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  const writeU32 = (offset, val) => view.setUint32(offset, val, true);
  const writeU16 = (offset, val) => view.setUint16(offset, val, true);

  writeStr(0,  'RIFF');  writeU32(4, 36 + dataSize);  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');  writeU32(16, 16);             writeU16(20, 1); // PCM
  writeU16(22, numCh);   writeU32(24, rate);           writeU32(28, rate * blockAlign);
  writeU16(32, blockAlign); writeU16(34, bitDepth);   writeStr(36, 'data'); writeU32(40, dataSize);

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}


/**
 * Download a clip to local disk with the correct filename.
 *
 * Strategy (in order of preference):
 *  1. Desktop (non-mobile): fetch → blob URL → <a download> — guaranteed filename, streams to disk
 *  2. Mobile / Android Chrome: Web Share API → save to device
 *  3. iOS fallback: open blob URL in new tab, long-press to save
 */
async function saveClip(url, filename, mimeType, onStatus) {
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  // ── Desktop path: fetch → blob → <a download> ─────────────────────────────
  // ⚠️ NEVER use target="_blank" with download — it causes a new tab instead of saving.
  // ⚠️ NEVER use Web Share on desktop — it shows an OS share dialog, not a file save.
  if (!mobile) {
    try {
      onStatus('loading');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a       = document.createElement('a');
      a.href        = blobUrl;
      a.download    = filename;         // ← sets saved filename
      // No target="_blank" — that overrides download and opens a tab
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      onStatus('done');
      return;
    } catch (err) {
      console.error('[saveClip desktop]', err);
      // fall through to mobile path
    }
  }

  // ── Mobile path: Web Share API (save to Files / Photos) ───────────────────
  if (
    mobile &&
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare
  ) {
    try {
      onStatus('loading');
      const res  = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: mimeType });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        onStatus('done');
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') { onStatus('done'); return; }
      // fall through to blob anchor
    }
  }

  // ── Android / iOS fallback: blob URL + anchor ─────────────────────────────
  try {
    onStatus('loading');
    const res     = await fetch(url);
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (isIOS()) {
      // iOS Safari can't trigger download via anchor; open in new tab
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      onStatus('open');
    } else {
      const a    = document.createElement('a');
      a.href     = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      onStatus('done');
    }
  } catch (_) {
    window.open(url, '_blank');
    onStatus('open');
  }
}

// ── Shared Download Logic ────────────────────────────────────────────────────
async function downloadClip(clip, forceMp3, onStatus) {
  const isVideoClip = clip.format === 'mp4' || clip.format === 'webm';

  if (forceMp3 && isVideoClip) {
    const mp3Url = clip.url?.startsWith('/api/clips/')
      ? clip.url.replace('/api/clips/', '/api/clip-audio/')
      : null;
    const mp3Filename = (clip.filename?.replace(/\.[^.]+$/, '') || 'clip') + '_audio.mp3';

    if (mp3Url) {
      await saveClip(mp3Url, mp3Filename, 'audio/mpeg', onStatus);
    } else {
      onStatus('loading');
      try {
        const res = await fetch(clip.url);
        const ab = await res.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await ctx.decodeAudioData(ab);
        const wavBlob = audioBufferToWav(decoded);
        await saveClip(URL.createObjectURL(wavBlob), mp3Filename.replace('.mp3', '.wav'), 'audio/wav', onStatus);
        ctx.close();
      } catch (e) {
        console.error('[mp3 extract]', e);
        onStatus('idle');
      }
    }
  } else {
    const mime = clip.format === 'mp3' ? 'audio/mpeg'
               : clip.format === 'webm' ? 'video/webm'
               : 'video/mp4';
    await saveClip(clip.url, clip.filename, mime, onStatus);
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
function ClipCard({ clip, index, isSelected, onSelect, selectionMode }) {
  const [showPlayer,   setShowPlayer]   = useState(false);
  const [dlState,      setDlState]      = useState('idle'); // idle|loading|done|open
  const [mp3State,     setMp3State]     = useState('idle'); // idle|loading|done|open

  const mime = clip.format === 'mp3' ? 'audio/mpeg'
             : clip.format === 'webm' ? 'video/webm'
             : 'video/mp4';

  const isVideoClip = clip.format === 'mp4' || clip.format === 'webm';

  const handleDownload = useCallback(async () => {
    if (dlState === 'loading') return;
    await downloadClip(clip, false, setDlState);
  }, [clip, dlState]);

  const handleMp3Download = useCallback(async () => {
    if (mp3State === 'loading') return;
    await downloadClip(clip, true, setMp3State);
  }, [clip, mp3State]);

  const dlLabel = dlState === 'loading' ? '⏳ Saving…'
                : dlState === 'done'    ? '✅ Saved!'
                : dlState === 'open'    ? '👆 Long-press → Save'
                : `⬇️ ${(clip.format || 'mp4').toUpperCase()}`;

  const mp3Label = mp3State === 'loading' ? '⏳ Converting…'
                 : mp3State === 'done'    ? '✅ Saved!'
                 : mp3State === 'open'    ? '👆 Long-press → Save'
                 : '🎵 MP3';

  return (
    <div
      className={`clip-card${isSelected ? ' clip-card--selected' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
      id={`clip-card-${clip.index}`}
    >
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <label className="clip-select-label" htmlFor={`clip-select-${clip.index}`}>
          <input
            id={`clip-select-${clip.index}`}
            type="checkbox"
            className="clip-select-checkbox"
            checked={isSelected}
            onChange={() => onSelect(clip.index)}
          />
          <span className="clip-select-checkmark">{isSelected ? '✓' : ''}</span>
        </label>
      )}

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

      {/* File size */}
      {clip.sizeFormatted && (
        <div className="clip-size-badge">{clip.sizeFormatted}</div>
      )}

      {/* Download buttons */}
      <div className="clip-actions">
        {/* Primary: download in original format */}
        <button
          id={`dl-${clip.format}-${clip.index}`}
          type="button"
          className={`clip-dl-btn ${clip.format === 'mp3' ? 'mp3' : 'mp4'}`}
          onClick={handleDownload}
          disabled={dlState === 'loading'}
          title={`Save Clip ${clip.index} as ${(clip.format||'mp4').toUpperCase()}`}
        >
          {dlLabel}
        </button>

        {/* Secondary: MP3 audio download (only for video clips) */}
        {isVideoClip && (
          <button
            id={`dl-mp3-${clip.index}`}
            type="button"
            className="clip-dl-btn mp3"
            onClick={handleMp3Download}
            disabled={mp3State === 'loading'}
            title={`Save audio as MP3`}
          >
            {mp3Label}
          </button>
        )}
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
export default function ClipGrid({ clips, isGenerating = false, totalExpected = 0 }) {
  const [bulkState,     setBulkState]     = useState('idle');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds,   setSelectedIds]   = useState(new Set());

  const handleBulkDownload = useCallback(async (forceMp3 = false) => {
    if (bulkState === 'loading') return;
    setBulkState('loading');

    for (const clip of clips) {
      await downloadClip(clip, forceMp3, () => {});
      await new Promise(r => setTimeout(r, 600));
    }
    setBulkState('done');
    setTimeout(() => setBulkState('idle'), 3000);
  }, [clips, bulkState]);

  const handleSelectedDownload = useCallback(async (forceMp3 = false) => {
    if (bulkState === 'loading') return;
    const toDownload = clips.filter(c => selectedIds.has(c.index));
    if (!toDownload.length) return;
    setBulkState('loading');
    
    for (const clip of toDownload) {
      await downloadClip(clip, forceMp3, () => {});
      await new Promise(r => setTimeout(r, 600));
    }
    setBulkState('done');
    setTimeout(() => { setBulkState('idle'); }, 3000);
  }, [clips, selectedIds, bulkState]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(v => !v);
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(clips.map(c => c.index)));
  }, [clips]);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  if (!clips?.length) return null;

  const ready    = clips.length;
  const expected = totalExpected || ready;
  const isLive   = isGenerating && ready < expected;

  return (
    <div className="clips-section">
      <div className="clips-header">
        <div className="clips-title">
          <span>🎌</span>
          Generated Clips
          <span className={`clips-count-badge${isLive ? ' clips-count-badge--live' : ''}`}>
            {isLive ? (
              <>
                <span className="clips-live-dot" />
                {ready} / {expected} ready
              </>
            ) : (
              `${ready} clips`
            )}
          </span>
        </div>

        <div className="bulk-actions">
          {/* Select mode toggle */}
          <button
            id="toggle-select-mode"
            type="button"
            className={`bulk-btn select-mode-btn${selectionMode ? ' active' : ''}`}
            onClick={toggleSelectionMode}
          >
            {selectionMode ? '✕ Cancel Select' : '☑ Select Clips'}
          </button>

          {/* Selection mode controls */}
          {selectionMode && (
            <>
              <button
                id="select-all-clips"
                type="button"
                className="bulk-btn select-all-btn"
                onClick={selectAll}
              >
                Select All
              </button>
              <button
                id="clear-selection"
                type="button"
                className="bulk-btn clear-btn"
                onClick={clearAll}
              >
                Clear
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  id="download-selected-clips-mp4"
                  type="button"
                  className="bulk-btn mp4"
                  onClick={() => handleSelectedDownload(false)}
                  disabled={selectedIds.size === 0 || bulkState === 'loading'}
                >
                  {bulkState === 'loading'
                    ? '⏳ Saving…'
                    : bulkState === 'done'
                    ? '✅ Done!'
                    : `⬇️ MP4 ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
                </button>
                <button
                  id="download-selected-clips-mp3"
                  type="button"
                  className="bulk-btn mp3"
                  onClick={() => handleSelectedDownload(true)}
                  disabled={selectedIds.size === 0 || bulkState === 'loading'}
                >
                  {bulkState === 'loading'
                    ? '⏳ Converting…'
                    : bulkState === 'done'
                    ? '✅ Done!'
                    : `🎵 MP3 ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
                </button>
              </div>
            </>
          )}

          {/* Download all — only show when not in selection mode */}
          {!selectionMode && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                id="bulk-download-media-mp4"
                type="button"
                className="bulk-btn mp4"
                onClick={() => handleBulkDownload(false)}
                disabled={bulkState === 'loading' || isLive}
                title={isLive ? 'Wait for all clips to finish' : ''}
              >
                {bulkState === 'loading' ? '⏳ Saving…'
               : bulkState === 'done'    ? '✅ Done!'
               : isLive                  ? `⏳ Generating…`
               : '⬇️ All MP4'}
              </button>
              <button
                id="bulk-download-media-mp3"
                type="button"
                className="bulk-btn mp3"
                onClick={() => handleBulkDownload(true)}
                disabled={bulkState === 'loading' || isLive}
                title={isLive ? 'Wait for all clips to finish' : ''}
              >
                {bulkState === 'loading' ? '⏳ Converting…'
               : bulkState === 'done'    ? '✅ Done!'
               : isLive                  ? `⏳ Generating…`
               : '🎵 All MP3'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="clips-grid">
        {clips.map((clip, i) => (
          <ClipCard
            key={clip.filename || i}
            clip={clip}
            index={i}
            isSelected={selectedIds.has(clip.index)}
            onSelect={toggleSelect}
            selectionMode={selectionMode}
          />
        ))}

        {/* Ghost placeholder cards for clips still generating */}
        {isLive && Array.from({ length: expected - ready }).map((_, i) => (
          <div key={`ghost-${i}`} className="clip-card clip-card--ghost">
            <div className="clip-card-header">
              <span className="clip-number">CLIP {String(ready + i + 1).padStart(2, '0')}</span>
            </div>
            <div className="clip-ghost-shimmer" />
            <div className="clip-ghost-label">⚡ Generating…</div>
          </div>
        ))}
      </div>
    </div>
  );
}
