'use client';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ParticleBackground = dynamic(() => import('../../components/ParticleBackground'), { ssr: false });

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [status,   setStatus]   = useState('idle');  // idle | loading | error
  const [errMsg,   setErrMsg]   = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setStatus('loading');
    setErrMsg('');

    try {
      const res  = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAttempts(n => n + 1);
        setErrMsg(data.error || 'Invalid credentials');
        setStatus('error');
        return;
      }

      setStatus('success');
      router.push(from);
      router.refresh();
    } catch {
      setErrMsg('Connection error. Try again.');
      setStatus('error');
    }
  }, [username, password, from, router]);

  return (
    <div className="login-card">
      {/* Lock icon */}
      <div className="login-icon-wrap">
        <div className="login-icon">🛡️</div>
        <div className="login-icon-ring" />
      </div>

      <h1 className="login-title">Admin Login</h1>
      <p className="login-subtitle">Akku ClipGen · Restricted Access</p>

      {attempts >= 3 && (
        <div className="login-warning">
          ⚠️ Multiple failed attempts detected. Make sure your credentials are correct.
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {/* Username */}
        <div className="login-field">
          <label htmlFor="admin-username" className="login-label">Username</label>
          <div className="login-input-wrap">
            <span className="login-input-icon">👤</span>
            <input
              id="admin-username"
              type="text"
              className="login-input"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              disabled={status === 'loading' || status === 'success'}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="login-field">
          <label htmlFor="admin-password" className="login-label">Password</label>
          <div className="login-input-wrap">
            <span className="login-input-icon">🔑</span>
            <input
              id="admin-password"
              type={showPw ? 'text' : 'password'}
              className="login-input"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={status === 'loading' || status === 'success'}
              required
            />
            <button
              type="button"
              className="login-toggle-pw"
              onClick={() => setShowPw(v => !v)}
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="login-error" role="alert">
            ❌ {errMsg}
          </div>
        )}

        {/* Submit */}
        <button
          id="admin-login-btn"
          type="submit"
          className="login-submit-btn"
          disabled={!username || !password || status === 'loading' || status === 'success'}
        >
          {status === 'loading' ? (
            <><span className="btn-spin">⚙️</span> Verifying…</>
          ) : status === 'success' ? (
            <><span>✅</span> Redirecting…</>
          ) : (
            <><span>🔓</span> Login</>
          )}
        </button>
      </form>

      <a href="/" className="login-back-link">← Back to Home</a>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <>
      <div className="login-page">
        <ParticleBackground />

        {/* Logo */}
        <div className="login-logo">
          <a href="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="logo-icon">✂️</div>
            <span className="logo-text">Akku ClipGen</span>
          </a>
        </div>

        {/* Centered login card */}
        <div className="login-center">
          <Suspense fallback={<div className="login-card" style={{ padding: '3rem', color: 'var(--text-muted)' }}>Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
