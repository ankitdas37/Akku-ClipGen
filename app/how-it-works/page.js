import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'How It Works - Akku ClipGen',
  description: 'Learn how to magically split your videos in just a few clicks!',
};

export default function HowItWorksPage() {
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
          <a href="/features" className="header-nav-link">Features</a>
          <a href="/contact" className="header-nav-link">Contact</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="cute-features-page">
        <div className="cute-features-header">
          <h1>🪄 How It Works</h1>
          <p>Slicing your videos has never been this easy or adorable! Just follow these magical steps~</p>
        </div>

        <section className="cute-features-section" aria-label="Steps">
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">📁</div>
            <h3 className="cute-feature-title">Step 1: Upload</h3>
            <p className="cute-feature-desc">Drag and drop your massive video file into our super cute upload zone! We support almost any format and unlimited file sizes, so go wild! 🌸</p>
          </div>
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">⏱️</div>
            <h3 className="cute-feature-title">Step 2: Configure</h3>
            <p className="cute-feature-desc">Choose exactly how long you want each clip to be. Whether it's bite-sized 15s clips for TikTok or 60s for YouTube Shorts, you're in control! 🎀</p>
          </div>
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">⚙️</div>
            <h3 className="cute-feature-title">Step 3: Generate</h3>
            <p className="cute-feature-desc">Hit that magical generate button and let our background fairies do the heavy lifting! We slice your video instantly with zero quality loss! ✨</p>
          </div>
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">🎁</div>
            <h3 className="cute-feature-title">Step 4: Download</h3>
            <p className="cute-feature-desc">Voila! Your clips are ready. You can download them individually as MP4 or MP3, or even grab them all at once! 💖</p>
          </div>
          
          <div className="cute-feature-card" style={{ gridColumn: '1 / -1', background: 'rgba(255, 105, 180, 0.05)', marginTop: '2rem' }}>
            <div className="cute-feature-icon" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>✨</div>
            <h3 className="cute-feature-title">Behind the Scenes (Ultimate Privacy & Zero Storage)</h3>
            <p className="cute-feature-desc">
              <strong>Can the Admin see your uploaded video?</strong> NO. Because we moved the processing entirely into your browser using WebAssembly, the video is completely private to you. It is never uploaded to the internet, so it is impossible for the Admin to see what video you uploaded.<br /><br />
              <strong>Are the videos saved on Vercel?</strong> NO. Absolutely nothing is saved on Vercel. Once the website loads, the video processing happens 100% inside your own computer's RAM. Because it never goes to Vercel, it never saves on Vercel. This means you get complete privacy and we don't have to pay for server storage!
            </p>
          </div>
          
        </section>
      </main>

      <Footer />
    </>
  );
}
