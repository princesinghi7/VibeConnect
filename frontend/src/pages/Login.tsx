import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './Auth.css';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Could not sign in. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleCredential(idToken: string) {
    setError('');
    try {
      await loginWithGoogle(idToken);
      navigate('/dashboard');
    } catch {
      setError('Could not sign in with Google. Make sure the backend is running with GOOGLE_CLIENT_ID set.');
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-side">
        <div className="auth-brand">
          <span className="brand-mark">{'</'}</span> VibeConnect
        </div>
        <h1 className="auth-headline">Where creators<br />find their brands.</h1>
        <p className="auth-sub">Profiles, campaigns, and a feed built for creators and the brands who want to work with them.</p>
        <div className="auth-pulse-row">
          <span className="pulse-dot" /> <span>2,400+ creators and brands collaborating right now</span>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-card glass" onSubmit={onSubmit}>
          <h2>Welcome back</h2>
          <p className="eyebrow" style={{ marginBottom: 20 }}>Sign in to continue building</p>

          <GoogleSignInButton onCredential={onGoogleCredential} />

          <div className="auth-divider"><span>or</span></div>

          <label className="auth-field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="auth-hint">
            Demo mode: any email + password works while the backend is offline.
          </p>

          <p className="auth-switch">
            New to VibeConnect? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
