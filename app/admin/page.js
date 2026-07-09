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

// ── Admins Manager ────────────────────────────────────────────────────────
function AdminsManager() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      setError('Failed to load admins.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');
      setSuccess(`Admin '${data.username}' created successfully!`);
      setForm({ username: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-msg-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ color: '#ff69b4', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>➕</span> Create New Admin
        </h2>
        {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)', marginBottom: '1rem' }}>{success}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ flex: '1 1 200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,192,203,0.3)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ flex: '1 1 200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,192,203,0.3)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={submitting}
            className="action-btn"
            style={{ flex: '0 0 auto', padding: '0.75rem 1.5rem', margin: 0, minWidth: '120px' }}
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div className="admin-msg-card" style={{ padding: '2rem' }}>
        <h2 style={{ color: '#a78bfa', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>👥</span> Existing Admins (Secondary)
        </h2>
        {loading ? (
          <div className="admin-loading">Loading admins…</div>
        ) : admins.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>No secondary admins found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {admins.map(a => (
              <div key={a.username} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                <span style={{ fontWeight: 'bold' }}>{a.username}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Created: {fmtDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('messages'); // messages | admins

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
            <img src="/logo.png" alt="Akku ClipGen Logo" className="logo-icon" style={{ objectFit: 'cover' }} />
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
            <h1>
              {activeTab === 'messages' ? 'Messages ' : 'Admin '}
              <span className="gradient-word">
                {activeTab === 'messages' ? 'Inbox' : 'Management'}
              </span>
            </h1>
            <p className="hero-sub">
              {activeTab === 'messages' 
                ? 'View and reply to all contact form submissions.'
                : 'Create and manage secondary admin users.'}
            </p>
          </section>

          {/* Top Navigation Tabs */}
          <div className="admin-filter-tabs" style={{ marginBottom: '2rem', justifyContent: 'center' }}>
            <button
              type="button"
              className={`admin-filter-tab${activeTab === 'messages' ? ' active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              ✉️ Inbox
            </button>
            <button
              type="button"
              className={`admin-filter-tab${activeTab === 'admins' ? ' active' : ''}`}
              onClick={() => setActiveTab('admins')}
            >
              👥 Admins
            </button>
          </div>

          {activeTab === 'admins' ? (
            <AdminsManager />
          ) : (
            <>
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
          </>
          )}
        </main>
      </div>
    </>
  );
}
