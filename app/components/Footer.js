export default function Footer() {
  const year = new Date().getFullYear();

  const columns = [
    {
      heading: 'Features',
      links: [
        { label: 'Video Splitting', href: '/features#video-splitting' },
        { label: 'MP4 Export', href: '/features#mp4-export' },
        { label: 'MP3 Extraction', href: '/features#mp3-extraction' },
        { label: 'Bulk Download', href: '/features#bulk-download' },
        { label: 'Zero Quality Loss', href: '/features#zero-quality-loss' },
      ],
    },
    {
      heading: 'Formats',
      links: [
        { label: 'MP4', href: '/formats#mp4' },
        { label: 'AVI', href: '/formats#avi' },
        { label: 'MOV', href: '/formats#mov' },
        { label: 'MKV', href: '/formats#mkv' },
        { label: 'WebM', href: '/formats#webm' },
        { label: 'MPEG', href: '/formats#mpeg' },
      ],
    },
    {
      heading: 'Support',
      links: [
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Report a Bug', href: '/report-bug' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'About',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Developed By', href: '/developer' },
      ],
    },
  ];

  return (
    <footer className="site-footer-main">
      <div className="footer-inner">

        {/* ── Top: Logo + Columns ── */}
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="Akku ClipGen Logo" className="footer-logo-icon" style={{ objectFit: 'cover' }} />
              <span className="footer-logo-text">Akku ClipGen</span>
            </div>
            <p className="footer-tagline">
              Split any video into perfect clips.<br />
              Download as MP4 or MP3 instantly.
            </p>
            <div className="footer-badge">✦ Anime Edition</div>
          </div>

          {/* Link columns */}
          <nav className="footer-columns" aria-label="Footer navigation">
            {columns.map(col => (
              <div key={col.heading} className="footer-col">
                <h3 className="footer-col-heading">{col.heading}</h3>
                <ul className="footer-col-links">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="footer-link">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Divider ── */}
        <div className="footer-divider" />

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <span className="footer-copy">
            Akku ClipGen © {year} &nbsp;·&nbsp;
            <a href="/contact" className="footer-bottom-link">Contact</a>
            &nbsp;·&nbsp;
            <a href="#" className="footer-bottom-link">Terms</a>
            &nbsp;·&nbsp;
            <a href="#" className="footer-bottom-link">Privacy</a>
          </span>

          {/* Social icons */}
          <div className="footer-socials">
            {/* Twitter/X */}
            <a href="https://x.com/AnkitDa01860054" className="footer-social-btn" aria-label="Twitter" title="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.836L1.254 2.25H8.08l4.257 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* GitHub */}
            <a href="https://github.com/ankitdas37" className="footer-social-btn" aria-label="GitHub" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" className="footer-social-btn" aria-label="YouTube" title="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Instagram */}
            <a href="https://www.instagram.com/the.ankit.das?igsh=Z3l6MzRiZDR3czF1" className="footer-social-btn" aria-label="Instagram" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
