import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'FAQ - Akku ClipGen',
  description: 'Frequently Asked Questions about Akku ClipGen.',
};

export default function FAQPage() {
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
          <h1>❓ FAQ</h1>
          <p>Got questions? We've got answers! 🎀</p>
        </div>

        <section className="cute-features-section" aria-label="Frequently Asked Questions">
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">📏</div>
            <h3 className="cute-feature-title">Is there a video size limit?</h3>
            <p className="cute-feature-desc">Nope! Thanks to our magical streaming technology, you can upload massively large files and we will process them without breaking a sweat! 🌟</p>
          </div>
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">🔒</div>
            <h3 className="cute-feature-title">Are my videos private?</h3>
            <p className="cute-feature-desc">100% Yes! All your files are processed locally on this machine and are automatically deleted the second you leave the page or close your browser. 💖</p>
          </div>
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">✂️</div>
            <h3 className="cute-feature-title">How long can my clips be?</h3>
            <p className="cute-feature-desc">You can configure the clip duration to be anything you want! 15 seconds for TikTok, 60 seconds for Shorts, or even 5 minutes! 🎀</p>
          </div>
          
          <div className="cute-feature-card">
            <div className="cute-feature-icon">💎</div>
            <h3 className="cute-feature-title">Will I lose video quality?</h3>
            <p className="cute-feature-desc">Absolutely not! We use ultra-fast stream-copying, meaning the clips look exactly as gorgeous and crisp as your original video! ✨</p>
          </div>
          
        </section>
      </main>

      <Footer />
    </>
  );
}
