import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let igScriptPromise: Promise<void> | null = null;
function loadInstagramScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve();
  if (igScriptPromise) return igScriptPromise;
  igScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return igScriptPromise;
}

export default function InstagramEmbed({ postUrl, profileUrl }: { postUrl?: string; profileUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!postUrl) return;
    loadInstagramScript().then(() => {
      window.instgrm?.Embeds.process();
    });
  }, [postUrl]);

  if (!postUrl) {
    return (
      <a href={profileUrl} target="_blank" rel="noreferrer" className="social-embed-card">
        <div className="social-embed-head">
          <span className="social-embed-icon ig">◎</span>
          <strong>Instagram</strong>
        </div>
        <p className="social-embed-note">Add a real post URL to embed a live post here — for now this links to the profile.</p>
      </a>
    );
  }

  return (
    <div className="ig-embed-wrap" ref={containerRef}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{ background: '#000', border: 0, borderRadius: 12, margin: 0, maxWidth: 360, width: '100%' }}
      />
    </div>
  );
}
