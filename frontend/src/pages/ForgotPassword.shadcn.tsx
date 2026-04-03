/**
 * Forgot Password Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { T, card } from '../tokens';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.bg, fontFamily: T.fontSans, padding: 20,
    }}>
      <div style={{ ...card, maxWidth: 420, width: '100%', padding: 40 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: '0 0 8px', textAlign: 'center' }}>
          Reset Password
        </h1>

        {sent ? (
          <>
            <p style={{ fontSize: 14, color: T.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
              If an account exists with <strong>{email}</strong>, we've sent a password reset link. Check your inbox.
            </p>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link to="/login" style={{ fontSize: 13, color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: T.textSecondary, textAlign: 'center', marginBottom: 24 }}>
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div style={{
                background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: T.danger,
              }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>
                  Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoFocus style={{
                    width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`,
                    borderRadius: 8, fontSize: 14, fontFamily: T.fontSans, background: T.bg,
                    color: T.textPrimary, outline: 'none', boxSizing: 'border-box' as const,
                  }} />
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '11px 16px', background: T.accent, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: T.fontSans,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.textSecondary }}>
              <Link to="/login" style={{ color: T.accent, textDecoration: 'none' }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
