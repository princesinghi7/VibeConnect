import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    FB?: { XFBML: { parse: (el?: HTMLElement) => void } };
    fbAsyncInit?: () => void;
  }
}

const APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

let fbScriptPromise: Promise<void> | null = null;
function loadFacebookSdk(): Promise<void> {
  if (window.FB) return Promise.resolve();
  if (fbScriptPromise) return fbScriptPromise;

  fbScriptPromise = new Promise((resolve) => {
    window.fbAsyncInit = () => {
      if (window.FB) {
        resolve();
      }
    };
    const script = document.createElement('script');
    script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0&appId=${APP_ID}`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  });
  return fbScriptPromise;
}

export default function FacebookPagePlugin({ pageUrl }: { pageUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const unavailable = !APP_ID;

  useEffect(() => {
    if (!APP_ID) return;
    loadFacebookSdk().then(() => {
      if (containerRef.current && window.FB?.XFBML) {
        window.FB.XFBML.parse(containerRef.current);
      }
    });
  }, [pageUrl]);

  if (unavailable) {
    return (
      <a href={pageUrl} target="_blank" rel="noreferrer" className="social-embed-card">
        <div className="social-embed-head">
          <span className="social-embed-icon fb">f</span>
          <strong>Facebook</strong>
        </div>
        <p className="social-embed-note">Set VITE_FACEBOOK_APP_ID to embed the live page here — for now this links to the profile.</p>
      </a>
    );
  }

  return (
    <div ref={containerRef} className="fb-embed-wrap">
      <div id="fb-root" />
      <div
        className="fb-page"
        data-href={pageUrl}
        data-tabs=""
        data-width="340"
        data-height="160"
        data-small-header="true"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="false"
      />
    </div>
  );
}
