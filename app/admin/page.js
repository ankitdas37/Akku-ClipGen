'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return 'Just now';
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Message Card ──────────────────────────────────────────────────────────
function MessageCard({ msg, onReply, onMarkRead }) {
  const [replyText, setReplyText] = useState('');
  const [sending,   setSending]   = useState(false);
  const [open,      setOpen]      = useState(false);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages/reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messageId: msg.id, replyText }),
      });
      if (res.ok) {
        setReplyText('');
        onReply(msg.id, replyText.trim());
      }
    } finally {
      setSending(false);
    }
  }, [replyText, sending, msg.id, onReply]);

  const handleMarkRead = useCallback(async () => {
    await fetch('/api/messages/reply', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messageId: msg.id }),
    });
    onMarkRead(msg.id);
  }, [msg.id, onMarkRead]);

  return (
    <div className={`admin-msg-card${msg.read ? '' : ' unread'}`} id={`msg-${msg.id}`}>
      {/* Card header */}
      <div className="admin-msg-header">
        <div className="admin-msg-meta">
          <div className="admin-sender-row">
            <div className="admin-avatar">
              {msg.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="admin-sender-name">{msg.name}</div>
              <a href={`mailto:${msg.email}`} className="admin-sender-email">{msg.email}</a>
            </div>
          </div>
          <div className="admin-msg-time">
            <span className="admin-time-ago">{timeAgo(msg.createdAt)}</span>
            <span className="admin-time-full">{fmtDate(msg.createdAt)}</span>
          </div>
        </div>
        <div className="admin-msg-subject">
          {!msg.read && <span className="unread-dot" aria-label="Unread" />}
          {msg.subject}
        </div>
      </div>

      {/* Message body (toggle) */}
      <button
        type="button"
        className="admin-msg-body-toggle"
        onClick={() => { setOpen(o => !o); if (!msg.read) handleMarkRead(); }}
      >
        <span className="admin-msg-preview">
          {open ? msg.message : msg.message.slice(0, 120) + (msg.message.length > 120 ? '…' : '')}
        </span>
        <span className="admin-toggle-icon">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded: full message + replies + reply box */}
      {open && (
        <div className="admin-msg-expanded">
          <div className="admin-msg-full">{msg.message}</div>

          {/* Existing replies */}
          {msg.replies?.length > 0 && (
            <div className="admin-replies">
              <div className="admin-replies-label">
                💬 Admin Replies ({msg.replies.length})
              </div>
              {msg.replies.map((r, i) => (
                <div key={i} className="admin-reply-bubble">
                  <span className="admin-reply-text">{r.text}</span>
                  <span className="admin-reply-time">{fmtDate(r.repliedAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reply box */}
          <div className="admin-reply-box">
            <div className="admin-reply-to">
              ↩ Replying to <strong>{msg.name}</strong> ({msg.email})
            </div>
            <textarea
              className="admin-reply-input"
              placeholder="Type your reply here…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={4}
              disabled={sending}
            />
            <div className="admin-reply-actions">
              <button
                type="button"
                className="admin-reply-btn"
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                id={`reply-send-${msg.id}`}
              >
                {sending ? '⏳ Sending…' : '🚀 Send Reply'}
              </button>
              <a
                href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(replyText)}`}
                className="admin-mailto-btn"
                title="Open in email client"
              >
                📧 Open in Mail
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');  // all | unread | replied
  const [error,     setError]     = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleReply = useCallback((id, text) => {
    setMessages(prev => prev.map(m =>
      m.id === id
        ? { ...m, read: true, replies: [...(m.replies || []), { text, repliedAt: new Date().toISOString() }] }
        : m
    ));
  }, []);

  const handleMarkRead = useCallback((id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }, []);

  const filtered = messages.filter(m => {
    if (filter === 'unread')  return !m.read;
    if (filter === 'replied') return m.replies?.length > 0;
    return true;
  });

  const unreadCount  = messages.filter(m => !m.read).length;
  const repliedCount = messages.filter(m => m.replies?.length > 0).length;

  return (
    <>
      <div className="page-wrapper">
        <ParticleBackground />

        {/* Header */}
        <header className="site-header">
          <a href="/" className="logo" aria-label="Akku ClipGen Home">
            <div className="logo-icon">✂️</div>
            <span className="logo-text">Akku ClipGen</span>
          </a>
          <nav className="header-nav">
            <a href="/" className="header-nav-link">Home</a>
            <a href="/contact" className="header-nav-link">Contact</a>
            <a href="/admin" className="header-nav-link active">Admin</a>
            <button
              type="button"
              id="admin-logout-btn"
              className="header-nav-link admin-logout-btn"
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
            >
              🔒 Logout
            </button>
          </nav>
        </header>

        <main className="main-content">

          {/* Hero */}
          <section className="hero contact-hero" style={{ marginBottom: '2rem' }}>
            <div className="hero-eyebrow">
              <span>🛡️</span> Admin Panel
            </div>
            <h1>Messages <span className="gradient-word">Inbox</span></h1>
            <p className="hero-sub">View and reply to all contact form submissions.</p>
          </section>

          {/* Stats row */}
          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <span className="admin-stat-num">{messages.length}</span>
              <span className="admin-stat-label">Total</span>
            </div>
            <div className="admin-stat-card unread-stat">
              <span className="admin-stat-num">{unreadCount}</span>
              <span className="admin-stat-label">Unread</span>
            </div>
            <div className="admin-stat-card replied-stat">
              <span className="admin-stat-num">{repliedCount}</span>
              <span className="admin-stat-label">Replied</span>
            </div>
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={fetchMessages}
              id="admin-refresh-btn"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Filter tabs */}
          <div className="admin-filter-tabs">
            {[
              { key: 'all',     label: `All (${messages.length})` },
              { key: 'unread',  label: `Unread (${unreadCount})` },
              { key: 'replied', label: `Replied (${repliedCount})` },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                className={`admin-filter-tab${filter === t.key ? ' active' : ''}`}
                onClick={() => setFilter(t.key)}
                id={`filter-${t.key}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Messages list */}
          {loading ? (
            <div className="admin-loading">
              <span className="admin-loading-icon">⚙️</span>
              <span>Loading messages…</span>
            </div>
          ) : error ? (
            <div className="error-banner">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <span style={{ fontSize: '3rem' }}>📭</span>
              <p>{filter === 'all' ? 'No messages yet.' : `No ${filter} messages.`}</p>
            </div>
          ) : (
            <div className="admin-messages-list">
              {filtered.map(msg => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  onReply={handleReply}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}

        </main>
      </div>
    </>
  );
}
