import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'Supported Formats - Akku ClipGen',
  description: 'Learn about all the magical video formats supported by Akku ClipGen.',
};

export default function FormatsPage() {
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
          <h1>📼 Supported Formats</h1>
          <p>We support all your favorite video formats! Here is a magical breakdown of each one~</p>
        </div>

        <section className="cute-features-section" aria-label="Formats">
          
          <div className="cute-feature-card" id="mp4">
            <div className="cute-feature-icon">🎀</div>
            <h3 className="cute-feature-title">MP4 (MPEG-4)</h3>
            <p className="cute-feature-desc">The absolute superstar of video formats! 🌟 MP4 works on literally everything—phones, browsers, and social media. It has a great balance of high quality and small file size.</p>
          </div>
          
          <div className="cute-feature-card" id="avi">
            <div className="cute-feature-icon">📺</div>
            <h3 className="cute-feature-title">AVI (Audio Video Interleave)</h3>
            <p className="cute-feature-desc">A classic, old-school favorite! 🕰️ Created by Microsoft, it offers super high quality but the files can be a bit chunky. Perfect for archiving your precious memories!</p>
          </div>
          
          <div className="cute-feature-card" id="mov">
            <div className="cute-feature-icon">🍏</div>
            <h3 className="cute-feature-title">MOV (QuickTime Movie)</h3>
            <p className="cute-feature-desc">Apple's special child! 🍎 MOV files are super high quality and look amazing on Macs and iPhones. They are the favorite choice of professional video editors!</p>
          </div>
          
          <div className="cute-feature-card" id="mkv">
            <div className="cute-feature-icon">🪆</div>
            <h3 className="cute-feature-title">MKV (Matroska)</h3>
            <p className="cute-feature-desc">The ultimate magic box! 📦 MKV can hold unlimited video, audio, and subtitle tracks in just one file. It's the absolute best format for high-definition anime and movies!</p>
          </div>
          
          <div className="cute-feature-card" id="webm">
            <div className="cute-feature-icon">🕸️</div>
            <h3 className="cute-feature-title">WebM</h3>
            <p className="cute-feature-desc">The hero of the internet! 🌐 Built specifically for the web, WebM loads super fast and is completely open-source. Perfect for embedding videos directly into cute websites!</p>
          </div>
          
          <div className="cute-feature-card" id="mpeg">
            <div className="cute-feature-icon">🎞️</div>
            <h3 className="cute-feature-title">MPEG</h3>
            <p className="cute-feature-desc">The wise elder of video formats! 🧙‍♀️ Highly compatible with almost any DVD player or older software. It paved the way for all the modern formats we use today!</p>
          </div>
          
        </section>
      </main>

      <Footer />
    </>
  );
}
