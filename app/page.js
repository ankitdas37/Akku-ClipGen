'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import UploadZone from './components/UploadZone';
import ClipConfigurator from './components/ClipConfigurator';
import ClipGrid from './components/ClipGrid';
import Footer from './components/Footer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ParticleBackground = dynamic(() => import('./components/ParticleBackground'), { ssr: false });

export default function Home() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [clips, setClips]         = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress]   = useState(0);
  const [genStatus, setGenStatus]       = useState('');
  const [error, setError]               = useState('');
  
  const ffmpegRef = useRef(null);

  useEffect(() => {
    // Only initialize FFmpeg on the client side to prevent Node.js SSR build errors
    if (typeof window !== 'undefined' && !ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }
  }, []);

  const handleUploadComplete = useCallback((info) => {
    setVideoInfo(info);
    setClips([]);
    setError('');
  }, []);

  const handleRemove = useCallback(() => {
    // Automatically delete (revoke) clips from browser RAM to free memory
    clips.forEach(clip => URL.revokeObjectURL(clip.url));
    
    setVideoInfo(null);
    setClips([]);
    setError('');
    setIsGenerating(false);
    setGenProgress(0);
  }, [clips]);

  const handleGenerate = useCallback(async (payload) => {
    if (!videoInfo?.file || isGenerating) return;
    setIsGenerating(true);
    setGenProgress(5);
    setGenStatus('Initialising ffmpeg…');
    
    // Cleanup old clips from memory if re-generating
    clips.forEach(clip => URL.revokeObjectURL(clip.url));
    setClips([]);
    setError('');

    const isCustom = payload.mode === 'custom';
    const totalClips = isCustom ? payload.customSegments.length : Math.ceil(videoInfo.duration / payload.clipDuration);

    try {
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('progress', ({ progress }) => {
        setGenProgress(Math.min(10 + (progress * 85), 95));
      });

      if (!ffmpeg.loaded) {
        setGenStatus('Downloading FFmpeg core (first time only)…');
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        });
      }

      setGenStatus('Loading video into memory…');
      const inputName = 'input_video.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(videoInfo.file));

      setGenStatus(`Splitting video into ${totalClips} clip${totalClips > 1 ? 's' : ''}…`);

      const duration = videoInfo.duration;
      let segments = [];
      const generatedClips = [];

      if (isCustom) {
        let clipIndex = 1;
        for (const seg of payload.customSegments) {
          if (seg.start >= 0 && seg.end > seg.start && seg.start < duration) {
            segments.push({
              index: clipIndex,
              startTime: seg.start,
              duration: seg.end - seg.start,
              endTime: seg.end,
              filename: `clip_custom_${String(clipIndex).padStart(3, '0')}.mp4`,
              isRemainder: false
            });
            clipIndex++;
          }
        }
      } else {
        const clipDuration = payload.clipDuration;
        let startTime = 0;
        let clipIndex = 1;
        while (startTime < duration - 0.5) {
          const remaining = duration - startTime;
          const segDuration = Math.min(clipDuration, remaining);
          segments.push({
            index: clipIndex,
            startTime,
            duration: segDuration,
            endTime: startTime + segDuration,
            filename: `clip_${String(clipIndex).padStart(3, '0')}.mp4`,
            isRemainder: remaining < clipDuration,
          });
          startTime += segDuration;
          clipIndex++;
        }
      }

      if (segments.length === 0) {
        throw new Error('No valid segments to generate.');
      }

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        setGenStatus(`Processing clip ${i + 1} of ${segments.length}…`);
        
        await ffmpeg.exec([
          '-ss', String(seg.startTime),
          '-i', inputName,
          '-t', String(seg.duration),
          '-c:v', 'copy',
          '-c:a', 'copy',
          seg.filename
        ]);

        const data = await ffmpeg.readFile(seg.filename);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);

        generatedClips.push({ ...seg, url });
        
        // Cleanup clip from memory after extracting blob
        await ffmpeg.deleteFile(seg.filename);
      }

      // Cleanup input from memory
      await ffmpeg.deleteFile(inputName);

      setGenProgress(100);
      setGenStatus('Done!');

      setTimeout(() => {
        setClips(generatedClips);
        setIsGenerating(false);
        setGenProgress(0);
        setTimeout(() => {
          document.querySelector('.clips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate clips. Please try again.');
      setIsGenerating(false);
      setGenProgress(0);
    }
  }, [videoInfo, isGenerating]);

  return (
    <>
      <div className="page-wrapper">
        <ParticleBackground />

        {/* Header */}
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

        {/* Main */}
        <main className="main-content">
          <section className="hero" aria-label="Hero section">
            <div className="hero-eyebrow">
              <span>🌸</span> Instant Video Splitter
            </div>
            <h1>Split Any Video<br />Into Perfect Clips</h1>
            <p className="hero-sub">
              Upload one long video, choose your clip length, and generate every segment
              instantly — all inside your browser. No size limits!
            </p>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
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
                  <span className="processing-icon">⚙️</span>
                  <h2 className="processing-title">{genStatus}</h2>
                  <p className="processing-sub">Using FFmpeg WebAssembly (100% private in-browser processing)</p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${genProgress}%` }} />
                  </div>
                  <p className="progress-label">{Math.round(genProgress)}%</p>
                </div>
              )}

              {!isGenerating && clips.length > 0 && (
                <ClipGrid clips={clips} />
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
