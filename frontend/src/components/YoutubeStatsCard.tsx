import { useEffect, useState } from 'react';
import { getYoutubeStats } from '../api/services';
import type { YoutubeStats } from '../api/types';

function formatCount(n?: number) {
  if (n === undefined) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

export default function YoutubeStatsCard({ handle, url }: { handle: string; url: string }) {
  const [stats, setStats] = useState<YoutubeStats | null>(null);

  useEffect(() => {
    getYoutubeStats(handle).then(setStats);
  }, [handle]);

  return (
    <a href={url} target="_blank" rel="noreferrer" className="social-embed-card">
      <div className="social-embed-head">
        <span className="social-embed-icon yt">▶</span>
        <strong>YouTube</strong>
        {stats?.connected && <span className="live-dot" title="Live data" />}
      </div>

      {!stats && <div className="skeleton" style={{ height: 18, width: '60%' }} />}

      {stats && stats.connected && (
        <div className="social-embed-stats">
          <span className="social-embed-stat"><strong>{formatCount(stats.subscriberCount)}</strong> subscribers</span>
          <span className="social-embed-stat"><strong>{formatCount(stats.videoCount)}</strong> videos</span>
        </div>
      )}

      {stats && !stats.connected && (
        <p className="social-embed-note">{stats.message ?? `@${handle} on YouTube`}</p>
      )}
    </a>
  );
}
