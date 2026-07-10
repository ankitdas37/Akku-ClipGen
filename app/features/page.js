import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'Features - Akku ClipGen',
  description: 'Discover the magical features of Akku ClipGen.',
};

export default function FeaturesPage() {
  return (
    <>
      <ParticleBackground />
      
      {/* Header */}
      <header className="site-header">
        <a href="/" className="logo" aria-label="Akku ClipGen Home">
          <img src="/logo.png" alt="Akku ClipGen Logo" className="logo-icon" style={{ objectFit: 'cover' }} />
          <span className="logo-text">Akku ClipGen</span>
        </a>
        <nav className="header-nav">
          <a href="/" className="header-nav-link">Home</a>
          <a href="/features" className="header-nav-link active">Features</a>
          <a href="/contact" className="header-nav-link">Contact</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="cute-features-page">
        <div className="cute-features-header">
          <h1>✨ Magical Features</h1>
          <p>Everything you need to create the perfect clips, with zero hassle!</p>
        </div>

        <section className="cute-features-section" aria-label="Features">
          <div className="cute-feature-card" id="video-splitting">
            <div className="cute-feature-icon">✨</div>
            <h3 className="cute-feature-title">Video Splitting</h3>
            <p className="cute-feature-desc">Upload massive videos and let our magic slice them into perfect byte-sized clips automatically!</p>
          </div>
          
          <div className="cute-feature-card" id="mp4-export">
            <div className="cute-feature-icon">🎞️</div>
            <h3 className="cute-feature-title">MP4 Export</h3>
            <p className="cute-feature-desc">Download your clips in crisp MP4 format, perfect for uploading to TikTok, Shorts, and Reels~</p>
          </div>
          
          <div className="cute-feature-card" id="mp3-extraction">
            <div className="cute-feature-icon">🎵</div>
            <h3 className="cute-feature-title">MP3 Extraction</h3>
            <p className="cute-feature-desc">Need just the audio? We extract the sweetest sounds straight to MP3 so you can groove on the go!</p>
          </div>
          
          <div className="cute-feature-card" id="bulk-download">
            <div className="cute-feature-icon">📦</div>
            <h3 className="cute-feature-title">Bulk Download</h3>
            <p className="cute-feature-desc">Save time! Grab all your processed clips at once with our super handy 'Download All' button.</p>
          </div>
          
          <div className="cute-feature-card" id="zero-quality-loss">
            <div className="cute-feature-icon">💎</div>
            <h3 className="cute-feature-title">Zero Quality Loss</h3>
            <p className="cute-feature-desc">We use special stream-copying magic to make sure your clips look exactly as gorgeous as the original!</p>
          </div>

          <div className="cute-feature-card" id="ultimate-privacy" style={{ gridColumn: '1 / -1', background: 'rgba(255, 105, 180, 0.05)' }}>
            <div className="cute-feature-icon" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>🛡️</div>
            <h3 className="cute-feature-title">100% Private (No Vercel Uploads)</h3>
            <p className="cute-feature-desc">
              <strong>Can the Admin see the user's uploaded video?</strong> NO. Because we moved the processing entirely into your browser using WebAssembly, the video is completely private to you. It is never uploaded to the internet, so it is impossible for the Admin to see what video you uploaded.<br /><br />
              <strong>Are the video and clips saved on Vercel?</strong> NO. Absolutely nothing is saved on Vercel. Once the website loads, the video processing happens 100% inside your own computer's RAM. Because it never goes to Vercel, it never saves on Vercel.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
