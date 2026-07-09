'use client';
import { useState, useCallback, useRef, useMemo } from 'react';

const PRESETS = [30, 59, 60, 90, 120];

function fmtSec(secs) {
  const s = Math.round(secs);
  if (s < 60)  return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m ${s%60 > 0 ? s%60+'s' : ''}`.trim();
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
}

function fmtTimecode(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function ClipConfigurator({ videoInfo, onGenerate, onRemove, isGenerating }) {
  const [clipDuration, setClipDuration] = useState(59);
  const [inputVal,     setInputVal]     = useState('59');
  const [mode,         setMode]         = useState('auto');
  const [customSegments, setCustomSegments] = useState([{ id: 1, start: '0', end: '10' }]);
  const [playerOpen,   setPlayerOpen]   = useState(true);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [videoDur,     setVideoDur]     = useState(0);
  const videoRef = useRef(null);

  const totalDuration = videoInfo?.duration || 0;

  // Derived clip math
  const segments = useMemo(() => {
    if (!clipDuration || !totalDuration) return [];
    const segs = [];
    let t = 0, idx = 1;
    while (t < totalDuration - 0.5) {
      const dur = Math.min(clipDuration, totalDuration - t);
      segs.push({ index: idx, start: t, dur, isRemainder: dur < clipDuration });
      t += dur; idx++;
    }
    return segs;
  }, [clipDuration, totalDuration]);

  const fullClips  = segments.filter(s => !s.isRemainder).length;
  const remainder  = segments.find(s => s.isRemainder);
  const totalClips = segments.length;

  const previewSrc = videoInfo?.jobId
    ? `/api/preview?jobId=${encodeURIComponent(videoInfo.jobId)}`
    : null;

  // ── Handlers ──────────────────────────────────────────────
  const selectPreset = useCallback((val) => {
    setClipDuration(val);
    setInputVal(String(val));
  }, []);

  const handleCustomInput = useCallback((e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputVal(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      setClipDuration(Math.min(num, Math.floor(totalDuration) || 999999));
    }
  }, [totalDuration]);

  const handleGenerate = useCallback(() => {
    if (mode === 'auto') {
      if (clipDuration > 0 && totalClips > 0 && !isGenerating) {
        onGenerate({ mode, clipDuration });
      }
    } else {
      const validSegments = customSegments.filter(s => {
        const start = parseInt(s.start);
        const end = parseInt(s.end);
        return !isNaN(start) && !isNaN(end) && start < end && start >= 0 && end <= (totalDuration || 999999);
      }).map(s => ({ start: parseInt(s.start), end: parseInt(s.end) }));
      
      if (validSegments.length > 0 && !isGenerating) {
        onGenerate({ mode, customSegments: validSegments });
      }
    }
  }, [mode, clipDuration, customSegments, totalClips, isGenerating, totalDuration, onGenerate]);

  // Width% for timeline bars
  const barWidth = useCallback((dur) => {
    if (!clipDuration) return 0;
    return Math.min(100, (dur / clipDuration) * 100);
  }, [clipDuration]);

  return (
    <div>
      {/* ── Video Info Card ── */}
      <div className="video-info-card">
        <div className="video-thumb-wrap">
          <div className="video-thumb-placeholder">🎬</div>
        </div>
        <div className="video-meta">
          <p className="video-name">{videoInfo?.filename || 'Untitled Video'}</p>
          <div className="video-stats">
            <span className="stat-chip violet">
              <span>⏱</span>
              <span>{videoInfo?.durationFormatted || '—'}</span>
            </span>
            <span className="stat-chip cyan">
              <span>💾</span>
              <span>{videoInfo?.sizeFormatted || '—'}</span>
            </span>
            <span className="stat-chip gold">
              <span>✅</span>
              <span>Ready to clip</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          className="remove-video-btn"
          onClick={onRemove}
          id="remove-video-btn"
          disabled={isGenerating}
        >
          ✕ Remove
        </button>
      </div>

      {/* ── Video Preview Player ── */}
      {previewSrc && (
        <div className="video-player-section">
          <div className="video-player-header">
            <div className="video-player-title">
              <span>▶</span> Preview Video
            </div>
            <button
              type="button"
              id="toggle-player-btn"
              className="toggle-player-btn"
              onClick={() => setPlayerOpen(o => !o)}
            >
              {playerOpen ? '▲ Hide' : '▼ Show'}
            </button>
          </div>
          <div className={`video-player-body${playerOpen ? '' : ' collapsed'}`}>
            <video
              ref={videoRef}
              id="main-video-player"
              className="main-video-player"
              src={previewSrc}
              controls
              controlsList="nodownload"
              preload="metadata"
              onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
              onLoadedMetadata={e => setVideoDur(e.target.duration)}
            />
          </div>
          <div className="video-player-footer">
            <span className="video-filename-label">📄 {videoInfo?.filename}</span>
            <span className="video-duration-label">
              {fmtTimecode(currentTime)} / {fmtTimecode(videoDur || totalDuration)}
            </span>
          </div>
        </div>
      )}

      {/* ── Modern Configurator Card ── */}
      <div className="configurator">

        {/* Header */}
        <div className="config-header">
          <div className="config-heading-row">
            <div className="config-heading-icon">⏱</div>
            <span className="config-heading-text">Clip Duration</span>
          </div>
          <div className="config-subheading">
            Video duration: <strong>{videoInfo?.durationFormatted || '—'}</strong>
          </div>
        </div>

        {/* Body */}
        <div className="config-body">
          <div className="config-mode-toggle">
            <button type="button" className={`mode-btn ${mode === 'auto' ? 'active' : ''}`} onClick={() => setMode('auto')}>Auto Split</button>
            <button type="button" className={`mode-btn ${mode === 'custom' ? 'active' : ''}`} onClick={() => setMode('custom')}>Custom Clips</button>
          </div>

          {mode === 'auto' ? (
            <>
              {/* Preset chips */}
              <div className="preset-label">Each clip length (seconds)</div>
              <div className="preset-chips">
                {PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`preset-chip${clipDuration === p ? ' active' : ''}`}
                    onClick={() => selectPreset(p)}
                    disabled={isGenerating}
                    id={`preset-${p}`}
                  >
                    {p}s
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="custom-input-wrap">
                <input
                  id="clip-duration-input"
                  type="text"
                  inputMode="numeric"
                  className="custom-duration-input"
                  value={inputVal}
                  onChange={handleCustomInput}
                  disabled={isGenerating}
                  maxLength={6}
                  aria-label="Custom clip duration in seconds"
                />
                <span className="custom-duration-unit">s</span>
              </div>

              {/* Summary card */}
              {totalDuration > 0 && clipDuration > 0 && (
                <div className="clip-summary-card">
                  <div className="summary-row">
                    <span className="summary-label">Full clips</span>
                    <span className="summary-value">
                      {fullClips > 0 ? `${fullClips} × ${fmtSec(clipDuration)}` : '—'}
                    </span>
                  </div>
                  {remainder && (
                    <div className="summary-row">
                      <span className="summary-label">Partial remaining</span>
                      <span className="summary-value highlight">{remainder.dur.toFixed(1)}s</span>
                    </div>
                  )}
                  <div className="summary-divider" />
                  <div className="summary-total-row">
                    <span className="summary-total-label">Total clips</span>
                    <span className="summary-total-value">{totalClips}</span>
                  </div>
                </div>
              )}

              {/* Timeline bars */}
              {segments.length > 0 && (
                <div className="timeline-list" role="list" aria-label="Clip timeline">
                  {segments.map(seg => (
                    <div key={seg.index} className="timeline-item" role="listitem">
                      <span className="timeline-index">#{seg.index}</span>
                      <div className="timeline-bar-track">
                        <div
                          className={`timeline-bar-fill${seg.isRemainder ? ' remainder' : ''}`}
                          style={{ width: `${barWidth(seg.dur)}%` }}
                        />
                      </div>
                      <span className="timeline-dur">{fmtSec(seg.dur)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="custom-segments-list">
              {customSegments.map((seg, i) => (
                <div key={seg.id} className="custom-segment-row">
                  <div className="custom-segment-inputs">
                    <div className="custom-segment-field">
                      <label>Start Time (sec)</label>
                      <input type="number" min="0" value={seg.start} onChange={e => {
                        const newSegs = [...customSegments];
                        newSegs[i].start = e.target.value;
                        setCustomSegments(newSegs);
                      }} disabled={isGenerating} />
                    </div>
                    <div className="custom-segment-field">
                      <label>End Time (sec)</label>
                      <input type="number" min="1" value={seg.end} onChange={e => {
                        const newSegs = [...customSegments];
                        newSegs[i].end = e.target.value;
                        setCustomSegments(newSegs);
                      }} disabled={isGenerating} />
                    </div>
                  </div>
                  <button type="button" className="remove-segment-btn" onClick={() => {
                    setCustomSegments(customSegments.filter(s => s.id !== seg.id));
                  }} disabled={isGenerating}>
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-segment-btn" onClick={() => {
                const maxId = Math.max(...customSegments.map(s => s.id), 0);
                setCustomSegments([...customSegments, { id: maxId + 1, start: '0', end: '10' }]);
              }} disabled={isGenerating}>
                + Add Another Clip
              </button>
            </div>
          )}

          {/* Generate button */}
          <button
            id="generate-clips-btn"
            type="button"
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || (mode === 'auto' && (!clipDuration || totalClips === 0)) || (mode === 'custom' && customSegments.length === 0)}
          >
            <span className="btn-label">
              {isGenerating
                ? 'Generating…'
                : (mode === 'auto' ? `Generate ${totalClips > 0 ? totalClips : ''} Clip${totalClips !== 1 ? 's' : ''}` : 'Generate Custom Clips')}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
