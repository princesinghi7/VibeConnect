import { useEffect, useState } from 'react';
import { getAnalytics } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import './Analytics.css';

interface Point { month: string; followers: number; engagementRate: number }

function buildPath(points: Point[], key: 'followers' | 'engagementRate', width: number, height: number, pad = 12) {
  const values = points.map((p) => p[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (points.length - 1);

  return points
    .map((p, i) => {
      const x = pad + i * stepX;
      const y = height - pad - ((p[key] - min) / range) * (height - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((d) => { setData(d as Point[]); setLoading(false); });
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 300 }} />;

  const width = 640;
  const height = 220;
  const followerPath = buildPath(data, 'followers', width, height);
  const engagementPath = buildPath(data, 'engagementRate', width, height);

  const latest = data[data.length - 1];
  const first = data[0];
  const followerGrowth = first ? (((latest.followers - first.followers) / first.followers) * 100).toFixed(1) : '0';

  return (
    <div className="analytics-page">
      <div>
        <h1>Analytics</h1>
        <p className="eyebrow">Your growth over the last {data.length} months</p>
      </div>

      <div className="analytics-stats">
        <div className="glass analytics-stat"><strong>{latest?.followers.toLocaleString('en-IN')}</strong><span>Followers</span></div>
        <div className="glass analytics-stat"><strong>{latest?.engagementRate}%</strong><span>Engagement rate</span></div>
        <div className="glass analytics-stat"><strong>+{followerGrowth}%</strong><span>Follower growth</span></div>
      </div>

      <div className="glass analytics-chart">
        <div className="analytics-chart-head">
          <h2>Follower growth</h2>
          <span className="tag">{user?.niche ?? 'Creator'}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg">
          <path d={followerPath} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          {data.map((p, i) => {
            const stepX = (width - 24) / (data.length - 1);
            const x = 12 + i * stepX;
            return <circle key={p.month} cx={x} cy={12} r="0" />;
          })}
        </svg>
        <div className="analytics-x-labels">
          {data.map((p) => <span key={p.month}>{p.month}</span>)}
        </div>
      </div>

      <div className="glass analytics-chart">
        <div className="analytics-chart-head">
          <h2>Engagement rate</h2>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg">
          <path d={engagementPath} fill="none" stroke="var(--accent-2)" strokeWidth="2.5" />
        </svg>
        <div className="analytics-x-labels">
          {data.map((p) => <span key={p.month}>{p.month}</span>)}
        </div>
      </div>
    </div>
  );
}
