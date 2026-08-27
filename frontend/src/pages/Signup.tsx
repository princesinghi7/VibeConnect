import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import type { AccountType } from '../api/types';
import './Auth.css';

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>('creator');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signup(name, email, password, accountType);
      navigate('/profile');
    } catch {
      setError('Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleCredential(idToken: string) {
    setError('');
    try {
      await loginWithGoogle(idToken, accountType);
      navigate('/profile');
    } catch {
      setError('Could not sign up with Google. Make sure the backend is running with GOOGLE_CLIENT_ID set.');
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-side">
        <div className="auth-brand">
          <span className="brand-mark">{'</'}</span> VibeConnect
        </div>
        <h1 className="auth-headline">Where creators<br />and brands collab.</h1>
        <p className="auth-sub">Build your profile, share your work, and get matched with the right people — whether you're making content or backing it.</p>
        <div className="auth-pulse-row">
          <span className="pulse-dot" /> <span>Setup takes under two minutes</span>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-card glass" onSubmit={onSubmit}>
          <h2>Create your account</h2>
          <p className="eyebrow" style={{ marginBottom: 18 }}>Join the creator × brand network</p>

          <div className="account-type-toggle">
            <button
              type="button"
              className={`account-type-btn${accountType === 'creator' ? ' active' : ''}`}
              onClick={() => setAccountType('creator')}
            >
              <span className="account-type-icon">✦</span>
              <span>I'm a Creator</span>
            </button>
            <button
              type="button"
              className={`account-type-btn${accountType === 'brand' ? ' active' : ''}`}
              onClick={() => setAccountType('brand')}
            >
              <span className="account-type-icon">◧</span>
              <span>I'm a Brand</span>
            </button>
          </div>

          <label className="auth-field">
            <span>{accountType === 'brand' ? 'Brand / company name' : 'Full name'}</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={accountType === 'brand' ? 'Nova Skincare' : 'Prince Singh'} />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={busy}>
            {busy ? 'Creating account…' : `Create ${accountType} account`}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <GoogleSignInButton onCredential={onGoogleCredential} />

          <p className="auth-switch">
            Already on VibeConnect? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
