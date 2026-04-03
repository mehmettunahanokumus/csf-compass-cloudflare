/**
 * Accept Team Invitation Page
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { acceptInvite } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { T, card } from '../tokens';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await acceptInvite({ token: token!, password, full_name: fullName });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`,
    borderRadius: 8, fontSize: 14, fontFamily: T.fontSans, background: T.bg,
    color: T.textPrimary, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.bg, fontFamily: T.fontSans, padding: 20,
    }}>
      <div style={{ ...card, maxWidth: 420, width: '100%', padding: 40 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: '0 0 8px', textAlign: 'center' }}>
          Join Your Team
        </h1>
        <p style={{ fontSize: 14, color: T.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Create your account to start collaborating
        </p>

        {error && (
          <div style={{
            background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: T.danger,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>
              Full Name
            </label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              required autoFocus placeholder="John Doe" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>
              Password
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={8} placeholder="At least 8 characters" style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 16px', background: T.accent, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: T.fontSans,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creating account...' : 'Create Account & Join'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.textSecondary }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
