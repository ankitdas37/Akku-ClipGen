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
            <h3 className="cute-feature-title">1. Can the Admin see the user's uploaded video or clips?</h3>
            <p className="cute-feature-desc">NO. Because we moved the processing entirely into your browser using WebAssembly, the video is completely private to you. It is never uploaded to the internet, so it is impossible for the Admin (or anyone else in the world) to see what video you uploaded or what clips you generated. The Admin panel will only show things like Contact Form messages.</p>
          </div>

          <div className="cute-feature-card">
            <div className="cute-feature-icon">☁️</div>
            <h3 className="cute-feature-title">2. Are the video and clips saved on the Vercel website?</h3>
            <p className="cute-feature-desc">NO. Absolutely nothing is saved on Vercel. When a user visits our website, Vercel just sends them the code for the website. Once the website loads on their computer, the video processing happens 100% inside their own computer's RAM. Because it never goes to Vercel, it never saves on Vercel.</p>
          </div>

          <div className="cute-feature-card" style={{ gridColumn: '1 / -1', background: 'rgba(255, 105, 180, 0.05)' }}>
            <p className="cute-feature-desc" style={{ textAlign: 'center', margin: 0, fontWeight: 'bold', color: '#ff69b4' }}>
              This is the ultimate privacy and cost-saving feature of our app! Users get complete privacy, and you don't have to pay for server storage because their own computer holds the video files temporarily until they close the tab.
            </p>
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
