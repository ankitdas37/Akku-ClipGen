import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'Privacy Policy - Akku ClipGen',
  description: 'Your privacy is our priority.',
};

export default function PrivacyPage() {
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
          <h1>🛡️ Privacy Policy</h1>
          <p>Your data belongs to you, and nobody else! 🎀</p>
        </div>

        <section className="cute-features-section" aria-label="Privacy Terms" style={{ gridTemplateColumns: '1fr' }}>
          
          <div className="cute-feature-card" style={{ textAlign: 'left', padding: '2.5rem' }}>
            <div className="cute-feature-icon" style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center', display: 'block' }}>🔒</div>
            <h3 className="cute-feature-title" style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '1.5rem' }}>Zero Data Retention</h3>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              We believe that your personal files are your business. When you use Akku ClipGen, you are operating in a completely secure and private environment.
            </p>
            
            <div style={{ background: 'rgba(255, 105, 180, 0.1)', border: '1px solid rgba(255, 192, 203, 0.3)', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
              <p style={{ color: '#ffb6c1', fontSize: '1.2rem', fontWeight: 'bold', lineHeight: '1.6', margin: 0, textAlign: 'center' }}>
                ✨ You can only download your clips. We do NOT store any user data, and we do NOT store your uploaded videos! ✨
              </p>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8', marginTop: '2rem' }}>
              Every single video you upload is processed temporarily to generate your clips. The moment you close the tab, refresh the page, or leave the site, <strong>every single trace of your video and data is instantly and permanently deleted</strong> from the server.
            </p>
          </div>
          
        </section>
      </main>

      <Footer />
    </>
  );
}
