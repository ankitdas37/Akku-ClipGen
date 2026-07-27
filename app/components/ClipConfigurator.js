'use client';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

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
  const ms = Math.floor((secs % 1) * 100);
  const msStr = ms > 0 ? `.${String(ms).padStart(2, '0')}` : '';
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${msStr}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${msStr}`;
}

/** Parse HH:MM:SS, MM:SS, or plain seconds string → total seconds */
function parseTimecode(str) {
  if (!str) return NaN;
  str = str.trim();
  // Plain number (seconds)
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  // MM:SS or HH:MM:SS
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

/** Format seconds to HH:MM:SS */
function toHMS(secs) {
  const s = Math.floor(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ── Time picker field (slider + HH:MM:SS text input) ──────────────────────────
function TimeField({ label, value, max, onChange, disabled, id, onSetCurrent, playerTime }) {
  const [rawText, setRawText] = useState(toHMS(value));
  const [focused, setFocused] = useState(false);

  // Keep rawText in sync when value changes externally (e.g. slider move on other field)
  useEffect(() => {
    if (!focused) setRawText(toHMS(value));
  }, [value, focused]);

  const handleSlider = (e) => {
    const v = parseFloat(e.target.value);
    onChange(v);
    setRawText(toHMS(v));
  };

  const handleText = (e) => {
    setRawText(e.target.value);
    const parsed = parseTimecode(e.target.value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseTimecode(rawText);
    if (isNaN(parsed) || parsed < 0 || parsed > max) {
      // Reset to current valid value
      setRawText(toHMS(value));
    } else {
      onChange(parsed);
      setRawText(toHMS(parsed));
    }
  };

  return (
    <div className="timefield-wrap">
      <div className="timefield-header">
        <label className="timefield-label" htmlFor={id}>{label}</label>
        <div className="timefield-actions">
          {onSetCurrent && (
            <button
              type="button"
              className="timefield-use-current"
              onClick={() => {
                onChange(Math.floor(playerTime));
                setRawText(toHMS(Math.floor(playerTime)));
              }}
              disabled={disabled}
              title="Use current player position"
            >
              🎯 Use current
            </button>
          )}
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max={max}
        step="1"
        value={Math.round(value)}
        onChange={handleSlider}
        disabled={disabled}
        className="custom-range-slider timefield-slider"
        aria-label={label}
      />

      {/* HH:MM:SS text input */}
      <input
        id={id}
        type="text"
        className="timefield-text"
        value={rawText}
        onChange={handleText}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="HH:MM:SS or seconds"
        spellCheck={false}
        autoComplete="off"
      />

      {/* Live timecode badge */}
      <span className="timefield-badge">{fmtTimecode(value)}</span>
    </div>
  );
}

export default function ClipConfigurator({ videoInfo, onGenerate, onRemove, isGenerating }) {
  const [clipDuration, setClipDuration] = useState(59);
  const [inputVal,     setInputVal]     = useState('59');
  const [mode,         setMode]         = useState('auto');
  const [format,       setFormat]       = useState('mp4');
  const [customSegments, setCustomSegments] = useState([{ id: 1, start: 0, end: 10 }]);
  const [playerOpen,   setPlayerOpen]   = useState(true);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [videoDur,     setVideoDur]     = useState(0);
  const [previewSrc,   setPreviewSrc]   = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoInfo?.file) {
      const url = URL.createObjectURL(videoInfo.file);
      setPreviewSrc(url);
      if (videoRef.current) videoRef.current.load();
    }
  }, [videoInfo?.file]);

  const totalDuration = videoInfo?.duration || 0;

  // Auto-set the default end time for the first segment to video duration
  useEffect(() => {
    if (totalDuration > 0) {
      setCustomSegments(prev => prev.map((seg, i) =>
        i === 0 && seg.end === 10 ? { ...seg, end: Math.min(totalDuration, 60) } : seg
      ));
    }
  }, [totalDuration]);

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

  // ── Handlers ──────────────────────────────────────────────
  const selectPreset = useCallback((val) => {
    setClipDuration(val);
    setInputVal(String(val));
  }, []);

  const skipTime = useCallback((secs) => {
    if (videoRef.current) videoRef.current.currentTime += secs;
  }, []);

  const handleCustomInput = useCallback((e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputVal(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      setClipDuration(Math.min(num, Math.floor(totalDuration) || 999999));
    }
  }, [totalDuration]);

  const updateSegField = useCallback((i, field, value) => {
    setCustomSegments(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }, []);

  const handleGenerate = useCallback(() => {
    if (mode === 'auto') {
      if (clipDuration > 0 && totalClips > 0 && !isGenerating) {
        onGenerate({ mode, clipDuration, format });
      }
    } else {
      const validSegments = customSegments.filter(s => {
        const start = Number(s.start);
        const end   = Number(s.end);
        return !isNaN(start) && !isNaN(end) && start < end && start >= 0 && end <= (totalDuration || 999999);
      }).map(s => ({ start: Number(s.start), end: Number(s.end) }));

      if (validSegments.length > 0 && !isGenerating) {
        onGenerate({ mode, customSegments: validSegments, format });
      }
    }
  }, [mode, clipDuration, customSegments, totalClips, isGenerating, totalDuration, format, onGenerate]);

  // Width% for timeline bars
  const barWidth = useCallback((dur) => {
    if (!clipDuration) return 0;
    return Math.min(100, (dur / clipDuration) * 100);
  }, [clipDuration]);

  const customValid = customSegments.every(s => {
    const start = Number(s.start);
    const end   = Number(s.end);
    return !isNaN(start) && !isNaN(end) && start < end && end <= (totalDuration || 999999);
  });

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
          <div className="video-skip-controls" style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px 15px', background: 'rgba(0,0,0,0.4)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <button type="button" className="mode-btn" onClick={() => skipTime(-10)} style={{ padding: '6px 15px', fontSize: '13px' }}>⏪ -10s</button>
            <button type="button" className="mode-btn" onClick={() => skipTime(-5)}  style={{ padding: '6px 15px', fontSize: '13px' }}>⏪ -5s</button>
            <button type="button" className="mode-btn" onClick={() => skipTime(5)}   style={{ padding: '6px 15px', fontSize: '13px' }}>+5s ⏩</button>
            <button type="button" className="mode-btn" onClick={() => skipTime(10)}  style={{ padding: '6px 15px', fontSize: '13px' }}>+10s ⏩</button>
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
          <div className="config-mode-toggle" style={{ marginTop: '10px', marginBottom: '20px' }}>
            <button type="button" className={`mode-btn ${format === 'mp4' ? 'active' : ''}`} onClick={() => setFormat('mp4')}>🎬 MP4 Video</button>
            <button type="button" className={`mode-btn ${format === 'mp3' ? 'active' : ''}`} onClick={() => setFormat('mp3')}>🎵 MP3 Audio</button>
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
            /* ── Custom Clips Mode ── */
            <div className="custom-segments-list">
              {/* Helper tip */}
              <div className="custom-hint">
                <span>💡</span>
                <span>
                  Enter times as <strong>HH:MM:SS</strong>, <strong>MM:SS</strong>, or plain seconds.
                  Use <strong>🎯 Use current</strong> to paste the player's position.
                </span>
              </div>

              {customSegments.map((seg, i) => {
                const startSec = Number(seg.start);
                const endSec   = Number(seg.end);
                const dur      = endSec - startSec;
                const valid    = !isNaN(startSec) && !isNaN(endSec) && startSec < endSec && endSec <= (totalDuration || 999999);

                return (
                  <div key={seg.id} className={`custom-segment-row${valid ? '' : ' custom-segment-row--invalid'}`}>
                    {/* Row header */}
                    <div className="custom-seg-header">
                      <span className="custom-seg-index">Clip {i + 1}</span>
                      {valid && (
                        <span className="custom-seg-duration">
                          ⏱ {fmtSec(dur)} ({fmtTimecode(startSec)} → {fmtTimecode(endSec)})
                        </span>
                      )}
                      {!valid && endSec <= startSec && (
                        <span className="custom-seg-error">⚠ End must be after start</span>
                      )}
                      <button
                        type="button"
                        className="remove-segment-btn"
                        onClick={() => setCustomSegments(customSegments.filter(s => s.id !== seg.id))}
                        disabled={isGenerating}
                      >✕</button>
                    </div>

                    <div className="custom-segment-inputs">
                      <TimeField
                        id={`seg-start-${seg.id}`}
                        label="Start Time"
                        value={startSec}
                        max={totalDuration || 86400}
                        onChange={v => updateSegField(i, 'start', v)}
                        disabled={isGenerating}
                        onSetCurrent
                        playerTime={currentTime}
                      />
                      <TimeField
                        id={`seg-end-${seg.id}`}
                        label="End Time"
                        value={endSec}
                        max={totalDuration || 86400}
                        onChange={v => updateSegField(i, 'end', v)}
                        disabled={isGenerating}
                        onSetCurrent
                        playerTime={currentTime}
                      />
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="add-segment-btn"
                onClick={() => {
                  const maxId = Math.max(...customSegments.map(s => s.id), 0);
                  const lastEnd = Number(customSegments[customSegments.length - 1]?.end || 0);
                  const newStart = Math.min(lastEnd, totalDuration - 1);
                  const newEnd   = Math.min(newStart + 60, totalDuration);
                  setCustomSegments([...customSegments, { id: maxId + 1, start: newStart, end: newEnd }]);
                }}
                disabled={isGenerating}
              >
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
            disabled={
              isGenerating ||
              (mode === 'auto' && (!clipDuration || totalClips === 0)) ||
              (mode === 'custom' && (customSegments.length === 0 || !customValid))
            }
          >
            <span className="btn-label">
              {isGenerating
                ? 'Generating…'
                : (mode === 'auto'
                  ? `Generate ${totalClips > 0 ? totalClips : ''} Clip${totalClips !== 1 ? 's' : ''}`
                  : `Generate ${customSegments.length} Custom Clip${customSegments.length !== 1 ? 's' : ''}`)}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
