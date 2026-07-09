'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export default function ReportBugPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const name = e.target.name.value;
    const email = e.target.email.value;
    const issue = e.target.issue.value;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: 'Bug Report',
          message: issue
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send report. Please try again.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="cute-features-header">
          <h1>🐛 Report a Bug</h1>
          <p>Did a pesky bug ruin your magic? Let us know so we can squish it! 🔨</p>
        </div>

        <section className="cute-features-section" aria-label="Report Bug Form" style={{ gridTemplateColumns: '1fr' }}>
          <div className="cute-feature-card" style={{ textAlign: 'left', padding: '2.5rem' }}>
            {!submitted ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
                
                <div>
                  <label htmlFor="name" style={{ display: 'block', color: '#ffb6c1', fontWeight: 'bold', marginBottom: '0.5rem' }}>Your Name</label>
                  <input type="text" id="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 192, 203, 0.3)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} placeholder="Senpai..." />
                </div>

                <div>
                  <label htmlFor="email" style={{ display: 'block', color: '#ffb6c1', fontWeight: 'bold', marginBottom: '0.5rem' }}>Your Email</label>
                  <input type="email" id="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 192, 203, 0.3)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} placeholder="senpai@example.com" />
                </div>
                
                <div>
                  <label htmlFor="issue" style={{ display: 'block', color: '#ffb6c1', fontWeight: 'bold', marginBottom: '0.5rem' }}>What happened?</label>
                  <textarea id="issue" rows={5} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 192, 203, 0.3)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', resize: 'vertical' }} placeholder="I clicked the magic button and then..."></textarea>
                </div>
                
                <button type="submit" disabled={isSubmitting} style={{ padding: '1rem', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s', marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Casting Spell... 🪄' : 'Squish the Bug! 🪄'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💖</div>
                <h3 style={{ color: '#ffb6c1', fontSize: '1.5rem', marginBottom: '1rem' }}>Thank you!</h3>
                <p style={{ color: 'var(--text-muted)' }}>We've received your report and our fairies are already working on a fix!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
