/**
 * Reset Password Page
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { T, card } from '../tokens';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token!, password);
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
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
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: '0 0 24px', textAlign: 'center' }}>
          Set New Password
        </h1>

        {error && (
          <div style={{
            background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: T.danger,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>
              New Password
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={8} placeholder="At least 8 characters" style={{
                width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`,
                borderRadius: 8, fontSize: 14, fontFamily: T.fontSans, background: T.bg,
                color: T.textPrimary, outline: 'none', boxSizing: 'border-box' as const,
              }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>
              Confirm Password
            </label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              required minLength={8} style={{
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.textSecondary }}>
          <Link to="/login" style={{ color: T.accent, textDecoration: 'none' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
