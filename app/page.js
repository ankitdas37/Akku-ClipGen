'use client';
import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import UploadZone from './components/UploadZone';
import ClipConfigurator from './components/ClipConfigurator';
import ClipGrid from './components/ClipGrid';
import Footer from './components/Footer';

const ParticleBackground = dynamic(() => import('./components/ParticleBackground'), { ssr: false });

export default function Home() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [clips, setClips]         = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress]   = useState(0);
  const [genStatus, setGenStatus]       = useState('');
  const [error, setError]               = useState('');

  // Automatic cleanup when the user leaves the page, refreshes, or closes the browser tab
  useEffect(() => {
    const currentJobId = videoInfo?.jobId;
    if (!currentJobId) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery during unload
      navigator.sendBeacon(`/api/cleanup?jobId=${currentJobId}`);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup when the component unmounts (e.g., navigating to another page)
      navigator.sendBeacon(`/api/cleanup?jobId=${currentJobId}`);
    };
  }, [videoInfo?.jobId]);

  const handleUploadComplete = useCallback((info) => {
    setVideoInfo(info);
    setClips([]);
    setError('');
  }, []);

  const handleRemove = useCallback(async () => {
    if (videoInfo?.jobId) {
      fetch(`/api/cleanup?jobId=${videoInfo.jobId}`).catch(() => {});
    }
    setVideoInfo(null);
    setClips([]);
    setError('');
    setIsGenerating(false);
    setGenProgress(0);
  }, [videoInfo]);

  const handleGenerate = useCallback(async (payload) => {
    if (!videoInfo?.jobId || isGenerating) return;
    setIsGenerating(true);
    setGenProgress(5);
    setGenStatus('Initialising ffmpeg…');
    setClips([]);
    setError('');

    const isCustom = payload.mode === 'custom';
    const totalClips = isCustom ? payload.customSegments.length : Math.ceil(videoInfo.duration / payload.clipDuration);
    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress = Math.min(currentProgress + (85 / (totalClips * 3 + 5)), 88);
      setGenProgress(currentProgress);
    }, 400);

    try {
      setGenStatus(`Splitting video into ${totalClips} clip${totalClips > 1 ? 's' : ''}…`);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: videoInfo.jobId,
          totalDuration: videoInfo.duration,
          ...payload
        }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || 'Failed to generate clips');
      }

      setGenProgress(95);
      setGenStatus('Finalising clips…');

      const data = await res.json();

      setGenProgress(100);
      setGenStatus('Done!');

      setTimeout(() => {
        setClips(data.clips);
        setIsGenerating(false);
        setGenProgress(0);
        setTimeout(() => {
          document.querySelector('.clips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 600);
    } catch (err) {
      clearInterval(interval);
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
              instantly — download each as <strong>MP4</strong> or <strong>MP3</strong> with zero quality loss.
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
                  <p className="processing-sub">Using ffmpeg to split your video — please wait…</p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${genProgress}%` }} />
                  </div>
                  <p className="progress-label">{Math.round(genProgress)}%</p>
                </div>
              )}

              {!isGenerating && clips.length > 0 && (
                <ClipGrid clips={clips} jobId={videoInfo.jobId} />
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
