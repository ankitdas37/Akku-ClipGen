import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export const metadata = {
  title: 'Developer - Akku ClipGen',
  description: 'Meet the developer behind Akku ClipGen.',
};

export default function DeveloperPage() {
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
      <main className="cute-features-page" style={{ maxWidth: '700px' }}>
        <div className="cute-features-header" style={{ marginBottom: '2rem' }}>
          <h1>👨‍💻 Developed By</h1>
          <p>The magical creator behind this project! ✨</p>
        </div>

        <section className="cute-features-section" aria-label="Developer Profile" style={{ gridTemplateColumns: '1fr' }}>

          <div className="cute-feature-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

            {/* Developer Image */}
            <div style={{
              width: '175px',
              height: '190px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #ffb6c1, #87ceeb)',
              padding: '4px',
              boxShadow: '0 10px 25px -5px rgba(255, 105, 180, 0.4)'
            }}>
              {/* Using a cute placeholder avatar. User can replace the src with their own image later! */}
              <img
                src="/Image/ankit.jpg"
                alt="Ankit Das"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>

            {/* Developer Details */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2.5rem', color: '#ffb6c1', margin: '0 0 0.5rem 0' }}>Ankit Das</h2>
              <p style={{ color: 'var(--brand)', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                CST Student 🚀
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto' }}>
                Currently pursuing a Diploma in <strong>Computer Science & Technology</strong> at <strong>Technique Polytechnic Institute</strong>. Passionate about building magical, beautiful, and high-performance web applications! 🌸
              </p>
            </div>

            {/* Contact Links with Icons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>

              <a href="mailto:ankitdas082006@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.2rem', borderRadius: '50px', color: 'white', textDecoration: 'none', border: '1px solid rgba(255,192,203,0.2)', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '1.2rem' }}>📧</span> Email
              </a>

              <a href="https://github.com/ankitdas37" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.2rem', borderRadius: '50px', color: 'white', textDecoration: 'none', border: '1px solid rgba(255,192,203,0.2)', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '1.2rem' }}>🐙</span> GitHub
              </a>

              <a href="https://www.linkedin.com/in/ankit-das-434594340?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.2rem', borderRadius: '50px', color: 'white', textDecoration: 'none', border: '1px solid rgba(255,192,203,0.2)', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '1.2rem' }}>💼</span> LinkedIn
              </a>

            </div>




          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}
