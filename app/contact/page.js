'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

const CONTACT_DETAILS = [
  {
    icon: '📧',
    label: 'Email',
    value: 'ankitdas@gmail.com',
    href: 'mailto:ankitdas082006@gmail.com',
    color: 'violet',
  },
  {
    icon: '💬',
    label: 'LinkedIn',
    value: 'Ankit Das',
    href: 'https://www.linkedin.com/in/ankit-das-434594340/',
    color: 'blue',
  },
  {
    icon: '🐙',
    label: 'GitHub',
    value: 'ankitdas37',
    href: 'https://github.com/ankitdas37',
    color: 'cyan',
  },
  {
    icon: '📸',
    label: 'Instagram',
    value: '@the.ankit.das',
    href: 'https://www.instagram.com/the.ankit.das',
    color: 'sakura',
  },
  {
    icon: '🐦',
    label: 'Twitter / X',
    value: '@AnkitDa01860054',
    href: 'https://x.com/AnkitDa01860054',
    color: 'gold',
  },
];

const FAQ = [
  {
    q: 'What video formats are supported?',
    a: 'Akku ClipGen supports all major formats: MP4, AVI, MOV, MKV, WebM, MPEG, M4V, 3GP, FLV, WMV and more.',
  },
  {
    q: 'Does clipping reduce video quality?',
    a: 'No. We use ffmpeg stream copy (-c copy) — the video and audio streams are copied exactly, with zero re-encoding and zero quality loss.',
  },
  {
    q: 'How large a video can I upload?',
    a: 'There is no hard limit enforced by the app itself. Practical limits depend on your available disk space and RAM. Videos up to several GB work fine.',
  },
  {
    q: 'Where are my clips stored?',
    a: "Clips are saved temporarily in the project's tmp/ folder on your local machine. They are deleted when you click \"Remove Video\" or close the session.",
  },
  {
    q: 'Can I download all clips at once?',
    a: 'Yes! Use the "Download All MP4" or "Download All MP3" buttons at the top of the clip grid to download every clip sequentially.',
  },
  {
    q: 'Can the Admin see my uploaded video or clips?',
    a: 'NO. Because we moved the processing entirely into your browser using WebAssembly, the video is completely private to you. It is never uploaded to the internet, so it is impossible for the Admin (or anyone else in the world) to see what video you uploaded or what clips you generated. The Admin panel will only show things like Contact Form messages. ☁️',
  },
  {
    q: 'Are the video and clips saved on the Vercel website?',
    a: 'NO. Absolutely nothing is saved on Vercel. When a user visits our website, Vercel just sends them the code for the website. Once the website loads on their computer, the video processing happens 100% inside their own computer\'s RAM. Because it never goes to Vercel, it never saves on Vercel.',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');  // idle | sending | success | error
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      alert('Error: ' + err.message);
      setStatus('idle');
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <ParticleBackground />

        {/* ── Header ── */}
        <header className="site-header">
          <a href="/" className="logo" aria-label="Akku ClipGen Home">
            <img src="/logo.png" alt="Akku ClipGen Logo" className="logo-icon" style={{ objectFit: 'cover' }} />
            <span className="logo-text">Akku ClipGen</span>
          </a>
          <nav className="header-nav">
            <a href="/" className="header-nav-link">Home</a>
            <a href="/contact" className="header-nav-link active">Contact</a>
          </nav>
        </header>

        {/* ── Hero ── */}
        <main className="main-content">
          <section className="hero contact-hero">
            <div className="hero-eyebrow">
              <span>✉️</span> Get In Touch
            </div>
            <h1>Contact <span className="gradient-word">Akku ClipGen</span></h1>
            <p className="hero-sub">
              Questions, feedback, bug reports or just want to say hello?
              We'd love to hear from you. 🌸
            </p>
          </section>

          {/* ── Two-column layout ── */}
          <div className="contact-grid">

            {/* ── Left: Form ── */}
            <div className="contact-form-card">
              <div className="contact-card-header">
                <span className="contact-card-icon">💌</span>
                <div>
                  <h2 className="contact-card-title">Send a Message</h2>
                  <p className="contact-card-sub">We'll reply as soon as possible</p>
                </div>
              </div>

              {status === 'success' ? (
                <div className="contact-success">
                  <span className="contact-success-icon">🎉</span>
                  <h3>Message Sent!</h3>
                  <p>Thanks for reaching out. We'll get back to you shortly.</p>
                  <button
                    type="button"
                    className="contact-again-btn"
                    onClick={() => setStatus('idle')}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="contact-name" className="form-label">Your Name</label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        className="form-input"
                        placeholder="Ankit Das"
                        value={form.name}
                        onChange={handleChange}
                        required
                        disabled={status === 'sending'}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="contact-email" className="form-label">Email Address</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        disabled={status === 'sending'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-subject" className="form-label">Subject</label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      className="form-input"
                      placeholder="Bug report, Feature request, General question…"
                      value={form.subject}
                      onChange={handleChange}
                      disabled={status === 'sending'}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message" className="form-label">Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      className="form-input form-textarea"
                      placeholder="Tell us what's on your mind…"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      disabled={status === 'sending'}
                    />
                  </div>

                  <button
                    type="submit"
                    className="contact-submit-btn"
                    disabled={status === 'sending' || !form.name || !form.email || !form.message}
                    id="contact-submit-btn"
                  >
                    {status === 'sending' ? (
                      <><span className="btn-spin">⚙️</span> Sending…</>
                    ) : (
                      <><span>🚀</span> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ── Right: Info ── */}
            <div className="contact-info-col">

              {/* Contact details */}
              <div className="contact-detail-card">
                <h2 className="contact-card-title" style={{ marginBottom: '1.2rem' }}>
                  Find Us Online
                </h2>
                <div className="contact-details-list">
                  {CONTACT_DETAILS.map(item => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`contact-detail-item color-${item.color}`}
                    >
                      <span className="detail-icon">{item.icon}</span>
                      <div className="detail-text">
                        <span className="detail-label">{item.label}</span>
                        <span className="detail-value">{item.value}</span>
                      </div>
                      <span className="detail-arrow">→</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Response time */}
              <div className="contact-response-card">
                <span className="response-icon">⏰</span>
                <div>
                  <div className="response-title">Response Time</div>
                  <div className="response-sub">Usually within 24–48 hours on weekdays.</div>
                </div>
              </div>

            </div>
          </div>

          {/* ── FAQ ── */}
          <section className="faq-section">
            <div className="faq-header">
              <div className="hero-eyebrow" style={{ marginBottom: '0.8rem' }}>
                <span>❓</span> FAQ
              </div>
              <h2 className="faq-title">Frequently Asked Questions</h2>
            </div>

            <div className="faq-list">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className={`faq-item${openFaq === i ? ' open' : ''}`}
                  id={`faq-${i}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{item.q}</span>
                    <span className="faq-chevron">{openFaq === i ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="faq-answer">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}
