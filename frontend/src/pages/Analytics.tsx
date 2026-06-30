import { useEffect, useState } from 'react';
import { getAnalytics } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import './Analytics.css';

interface Point { month: string; followers: number; engagementRate: number }

const WIDTH = 640;
const HEIGHT = 220;
const PAD = 16;

function buildPoints(points: Point[], key: 'followers' | 'engagementRate') {
  const values = points.map((p) => p[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (WIDTH - PAD * 2) / (points.length - 1);

  return points.map((p, i) => ({
    x: PAD + i * stepX,
    y: HEIGHT - PAD - ((p[key] - min) / range) * (HEIGHT - PAD * 2),
    value: p[key],
    month: p.month,
  }));
}

function AreaChart({ points, color, suffix = '' }: { points: Point[]; color: string; suffix?: string }) {
  const key = suffix === '%' ? 'engagementRate' : 'followers';
  const coords = buildPoints(points, key);
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x},${HEIGHT - PAD} L${coords[0].x},${HEIGHT - PAD} Z`;
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="analytics-svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} className="analytics-grid" />
      ))}

      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c) => (
        <g key={c.month}>
          <circle cx={c.x} cy={c.y} r="4" fill="var(--bg)" stroke={color} strokeWidth="2" />
          <title>{c.month}: {key === 'followers' ? c.value.toLocaleString('en-IN') : `${c.value}%`}</title>
        </g>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((d) => { setData(d as Point[]); setLoading(false); });
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 300 }} />;
  if (data.length === 0) return <p className="eyebrow">No analytics data yet.</p>;

  const latest = data[data.length - 1];
  const first = data[0];
  const followerGrowth = (((latest.followers - first.followers) / first.followers) * 100).toFixed(1);
  const engagementDelta = (latest.engagementRate - first.engagementRate).toFixed(1);

  const platformSplit = [
    { label: 'Instagram', pct: 58, color: 'var(--accent)' },
    { label: 'YouTube', pct: 30, color: 'var(--accent-2)' },
    { label: 'Facebook', pct: 12, color: '#fbbf78' },
  ];

  return (
    <div className="analytics-page">
      <div>
        <h1>Analytics</h1>
        <p className="eyebrow">Your growth over the last {data.length} months</p>
      </div>

      <div className="analytics-stats">
        <div className="glass analytics-stat">
          <span className="analytics-stat-icon">◎</span>
          <strong>{latest.followers.toLocaleString('en-IN')}</strong>
          <span>Followers</span>
        </div>
        <div className="glass analytics-stat">
          <span className="analytics-stat-icon">✦</span>
          <strong>{latest.engagementRate}%</strong>
          <span>Engagement rate</span>
        </div>
        <div className="glass analytics-stat">
          <span className="analytics-stat-icon">↗</span>
          <strong className="analytics-positive">+{followerGrowth}%</strong>
          <span>Follower growth</span>
        </div>
        <div className="glass analytics-stat">
          <span className="analytics-stat-icon">⚡</span>
          <strong className="analytics-positive">+{engagementDelta}pp</strong>
          <span>Engagement change</span>
        </div>
      </div>

      <div className="glass analytics-chart">
        <div className="analytics-chart-head">
          <h2>Follower growth</h2>
          <span className="tag">{user?.niche ?? 'Creator'}</span>
        </div>
        <AreaChart points={data} color="var(--accent)" />
        <div className="analytics-x-labels">{data.map((p) => <span key={p.month}>{p.month}</span>)}</div>
      </div>

      <div className="analytics-grid-2">
        <div className="glass analytics-chart">
          <div className="analytics-chart-head">
            <h2>Engagement rate</h2>
          </div>
          <AreaChart points={data} color="var(--accent-2)" suffix="%" />
          <div className="analytics-x-labels">{data.map((p) => <span key={p.month}>{p.month}</span>)}</div>
        </div>

        <div className="glass analytics-chart">
          <div className="analytics-chart-head">
            <h2>Audience by platform</h2>
          </div>
          <div className="platform-bars">
            {platformSplit.map((p) => (
              <div className="platform-bar-row" key={p.label}>
                <span className="platform-bar-label">{p.label}</span>
                <div className="platform-bar-track">
                  <div className="platform-bar-fill" style={{ width: `${p.pct}%`, background: p.color }} />
                </div>
                <span className="platform-bar-pct">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
