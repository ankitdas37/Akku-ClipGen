'use client';
import { useState, useRef, useCallback } from 'react';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function UploadZone({ onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/') || 
      /\.(mp4|webm|avi|mov|mkv|mpeg|mpg|ogv|m4v|3gp|flv|wmv|ts|m2ts)$/i.test(file.name);

    if (!isVideoFile) {
      setError('Please upload a valid video file.');
      return;
    }

    setError('');
    
    try {
      // Get video duration locally in browser
      const videoUrl = URL.createObjectURL(file);
      const duration = await new Promise((resolve) => {
        const vid = document.createElement('video');
        vid.preload = 'metadata';
        vid.onloadedmetadata = () => { resolve(vid.duration); URL.revokeObjectURL(videoUrl); };
        vid.onerror = () => { resolve(0); URL.revokeObjectURL(videoUrl); };
        vid.src = videoUrl;
      });

      // Pass the actual file directly, so the browser can process it
      onUploadComplete({
        file: file, // the actual File object
        filename: file.name,
        size: file.size,
        duration: duration,
        sizeFormatted: formatBytes(file.size),
        durationFormatted: formatDuration(duration),
        // use a client-side random id for jobs
        jobId: Math.random().toString(36).substring(2, 15)
      });
    } catch (err) {
      setError('Failed to read video file.');
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e) => {
    processFile(e.target.files[0]);
  }, [processFile]);

  return (
    <div>
      {error && (
        <div className="error-banner" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div
        id="upload-zone"
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload video file"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleChange}
          className="visually-hidden"
          id="video-file-input"
        />

        <span className="upload-icon">🎬</span>
        <p className="upload-title">Drop your video here</p>
        <p className="upload-sub">or click to browse your files</p>
        <button
          type="button"
          className="upload-btn"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          <span>📂</span>
          <span>Choose Video File</span>
        </button>
        <p className="upload-formats">
          Supports: MP4, AVI, MOV, MKV, WebM, MPEG &amp; more
        </p>
      </div>
    </div>
  );
}
