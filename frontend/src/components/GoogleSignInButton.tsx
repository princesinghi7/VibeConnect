import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
            ux_mode?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (notification: unknown) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number | string;
              type?: string;
              shape?: string;
              text?: string;
              logo_alignment?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const demoAccounts = [
  { name: 'Prince Singh', email: 'demo@vibeconnect.dev', avatar: '/prince-singh.jpg', type: 'creator' },
  { name: 'Priya Nair', email: 'priya@example.com', avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=priya', type: 'creator' },
  { name: 'Rohan Verma', email: 'rohan@example.com', avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=rohan', type: 'creator' },
  { name: 'Mamaearth', email: 'partnerships@mamaearth.example.com', avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=mamaearth', type: 'brand' },
];

let scriptLoadPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export default function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [unavailable, setUnavailable] = useState(!CLIENT_ID);
  const buttonRef = useRef<HTMLDivElement>(null);

  // New Custom Account Form State
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customType, setCustomType] = useState<'creator' | 'brand'>('creator');
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => {
            if (!resp?.credential) return;
            onCredential(resp.credential);
          },
          auto_select: false,
          ux_mode: 'popup',
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
          });
        }
      })
      .catch(() => setUnavailable(true));

    return () => { cancelled = true; };
  }, [onCredential]);

  function handleChooseDemo(email: string, name: string) {
    setShowPicker(false);
    onCredential(`google-demo:${email}:${name}`);
  }

  function handleCreateCustomMock(e: React.FormEvent) {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;
    setShowPicker(false);
    // Custom mock credentials are intercepted by the updated backend API
    onCredential(`google-demo:${customEmail.trim().toLowerCase()}:${customName.trim()}`);
  }

  return (
    <div style={{ width: '100%' }}>
      {CLIENT_ID ? (
        /* Native Google Sign In Button */
        <div ref={buttonRef} style={{ minHeight: 40, width: '100%', display: 'flex', justifyContent: 'center' }} />
      ) : (
        /* Beautiful custom button to trigger mock chooser modal */
        <button
          type="button"
          className="btn btn-ghost google-btn-fallback"
          onClick={() => setShowPicker(true)}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}
        >
          <span className="google-g" style={{ fontWeight: 'bold', color: '#4285F4' }}>G</span> Continue with Google (Demo)
        </button>
      )}

      {showPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: 16,
          }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="glass"
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 24,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              textAlign: 'left',
              animation: 'slideUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--display)' }}>Choose an account</h3>
                <p className="eyebrow" style={{ marginTop: 2 }}>to continue to VibeConnect</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowPicker(false)}
                style={{ padding: '6px 10px', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            {!showCustomForm ? (
              <>
                <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleChooseDemo(account.email, account.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        transition: 'border-color .15s ease, background .15s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <img
                        src={account.avatar}
                        alt={account.name}
                        width={36}
                        height={36}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: 13.5 }}>{account.name}</strong>
                        <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{account.email}</span>
                      </div>
                      <span className="tag" style={{ fontSize: 9.5 }}>{account.type}</span>
                    </button>
                  ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowCustomForm(true)}
                    style={{ fontSize: 13, width: '100%', justifyContent: 'center' }}
                  >
                    + Add or Register another account
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreateCustomMock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4 style={{ fontSize: 14 }}>Register Mock Google Account</h4>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Full Name</span>
                  <input
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter full name"
                    autoFocus
                  />
                </label>

                <label className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Email Address</span>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@gmail.com"
                  />
                </label>

                <div className="account-type-toggle" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className={`account-type-btn${customType === 'creator' ? ' active' : ''}`}
                    onClick={() => setCustomType('creator')}
                    style={{ flex: 1, padding: 8, fontSize: 12 }}
                  >
                    Creator
                  </button>
                  <button
                    type="button"
                    className={`account-type-btn${customType === 'brand' ? ' active' : ''}`}
                    onClick={() => setCustomType('brand')}
                    style={{ flex: 1, padding: 8, fontSize: 12 }}
                  >
                    Brand
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowCustomForm(false)}
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {unavailable && !CLIENT_ID && (
        <p className="auth-hint" style={{ marginTop: 8, textAlign: 'center' }}>
          Running in offline demo mode. Mock accounts available.
        </p>
      )}
    </div>
  );
}
