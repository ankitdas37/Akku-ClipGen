import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'Terms of Service - Akku ClipGen',
  description: 'Our Terms of Service and usage guidelines.',
};

export default function TermsPage() {
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
      <main className="cute-features-page" style={{ maxWidth: '800px' }}>
        <div className="cute-features-header">
          <h1>📜 Terms of Service</h1>
          <p>The magical rules of our realm! ✨</p>
        </div>

        <section className="cute-features-section" aria-label="Terms of Service" style={{ gridTemplateColumns: '1fr' }}>
          
          <div className="cute-feature-card" style={{ textAlign: 'left', padding: '2.5rem' }}>
            
            <h3 style={{ color: '#ffb6c1', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Welcome to Akku ClipGen! 🌸</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              By using our super cute video clipping service, you agree to these magical terms. We want everyone to have a safe, fun, and fast experience while slicing their favorite videos!
            </p>
            
            <h3 style={{ color: '#ffb6c1', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Fair Use & Copyright 🎬</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              Please only upload videos that you own or have the right to edit! Akku ClipGen is a tool meant for your personal convenience. We are not responsible for the content you choose to upload and clip.
            </p>

            <h3 style={{ color: '#ffb6c1', fontSize: '1.5rem', marginBottom: '1rem' }}>3. Service Availability ☁️</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              Since all processing happens locally and nothing is stored on our servers, there are no limits on how many videos you can clip! However, please be gentle with your browser so it doesn't crash from too much awesomeness.
            </p>

            <h3 style={{ color: '#ffb6c1', fontSize: '1.5rem', marginBottom: '1rem' }}>4. No Warranties 🛡️</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              Our fairies work very hard to keep everything bug-free, but Akku ClipGen is provided "as is." If something breaks or a video doesn't clip perfectly, let us know and we'll try our best to fix the magic!
            </p>

          </div>
          
        </section>
      </main>

      <Footer />
    </>
  );
}
