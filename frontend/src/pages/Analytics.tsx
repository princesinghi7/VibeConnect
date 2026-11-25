import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAnalytics } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import './Analytics.css';

interface AnalyticsPoint {
  month: string;
  followers: number;
  engagementRate: number;
}

type Range = '3M' | '6M' | 'ALL';
type MetricKey = 'followers' | 'engagementRate';

const CHART_WIDTH = 720;
const CHART_HEIGHT = 250;
const CHART_PAD = { top: 20, right: 18, bottom: 30, left: 18 };

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function normalisePoints(value: unknown): AnalyticsPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      month: String(item.month ?? ''),
      followers: Number(item.followers),
      engagementRate: Number(item.engagementRate),
    }))
    .filter((item) => item.month && Number.isFinite(item.followers) && Number.isFinite(item.engagementRate));
}

function getCoordinates(points: AnalyticsPoint[], key: MetricKey) {
  const values = points.map((point) => point[key]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const paddedMin = spread === 0 ? Math.max(0, minValue - 1) : minValue - spread * 0.16;
  const paddedMax = spread === 0 ? maxValue + 1 : maxValue + spread * 0.16;
  const plotWidth = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const plotHeight = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;

  return points.map((point, index) => {
    const x = points.length === 1
      ? CHART_WIDTH / 2
      : CHART_PAD.left + (index / (points.length - 1)) * plotWidth;
    const y = CHART_PAD.top + ((paddedMax - point[key]) / (paddedMax - paddedMin || 1)) * plotHeight;
    return { x, y, value: point[key], month: point.month };
  });
}

function TrendChart({ points, metric, color, formatValue }: {
  points: AnalyticsPoint[];
  metric: MetricKey;
  color: string;
  formatValue: (value: number) => string;
}) {
  const coordinates = getCoordinates(points, metric);
  const line = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const baseline = CHART_HEIGHT - CHART_PAD.bottom;
  const area = coordinates.length > 1
    ? `${line} L ${coordinates[coordinates.length - 1].x} ${baseline} L ${coordinates[0].x} ${baseline} Z`
    : '';
  const gradientId = `analytics-${metric}-gradient`;

  return (
    <div className="analytics-chart-visual">
      <svg className="analytics-svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${metric === 'followers' ? 'Follower' : 'Engagement rate'} trend chart`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = CHART_PAD.top + (lineIndex / 3) * (CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom);
          return <line key={lineIndex} x1={CHART_PAD.left} x2={CHART_WIDTH - CHART_PAD.right} y1={y} y2={y} className="analytics-grid-line" />;
        })}
        {area && <path d={area} fill={`url(#${gradientId})`} />}
        {coordinates.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {coordinates.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="8" fill={color} opacity=".13" />
            <circle cx={point.x} cy={point.y} r="3.5" fill="var(--bg)" stroke={color} strokeWidth="2.5" />
            <title>{point.month}: {formatValue(point.value)}</title>
          </g>
        ))}
      </svg>
      <div className="analytics-chart-months">
        {points.map((point) => <span key={point.month}>{point.month}</span>)}
      </div>
    </div>
  );
}

function downloadCsv(points: AnalyticsPoint[]) {
  const rows = [
    ['Month', 'Followers', 'Engagement rate (%)'],
    ...points.map((point) => [point.month, String(point.followers), String(point.engagementRate)]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'vibeconnect-analytics.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<Range>('6M');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAnalytics();
      setData(normalisePoints(result));
    } catch {
      setError('We could not load your analytics right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);

  const visibleData = useMemo(() => {
    if (range === 'ALL') return data;
    const count = range === '3M' ? 3 : 6;
    return data.slice(-count);
  }, [data, range]);

  const metrics = useMemo(() => {
    if (!visibleData.length) return null;
    const latest = visibleData[visibleData.length - 1];
    const previous = visibleData.length > 1 ? visibleData[visibleData.length - 2] : null;
    const first = visibleData[0];
    const followerChange = previous ? latest.followers - previous.followers : 0;
    const followerChangePct = previous && previous.followers !== 0
      ? (followerChange / previous.followers) * 100
      : 0;
    const engagementChange = previous ? latest.engagementRate - previous.engagementRate : 0;
    const averageEngagement = visibleData.reduce((sum, point) => sum + point.engagementRate, 0) / visibleData.length;
    const bestMonth = visibleData.reduce((best, point) => point.followers > best.followers ? point : best, first);
    const totalChange = latest.followers - first.followers;
    const totalChangePct = first.followers !== 0 ? (totalChange / first.followers) * 100 : 0;
    return { latest, previous, followerChange, followerChangePct, engagementChange, averageEngagement, bestMonth, totalChange, totalChangePct };
  }, [visibleData]);

  const rangeLabel = range === 'ALL' ? 'all available time' : `the last ${range === '3M' ? '3' : '6'} months`;

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header"><div className="analytics-skeleton analytics-skeleton-title" /><div className="analytics-skeleton analytics-skeleton-copy" /></div>
        <div className="analytics-stats">{[1, 2, 3, 4].map((item) => <div className="analytics-skeleton analytics-skeleton-card" key={item} />)}</div>
        <div className="analytics-skeleton analytics-skeleton-chart" />
        <div className="analytics-skeleton analytics-skeleton-chart" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-header"><div><span className="analytics-kicker">PERFORMANCE CENTER</span><h1>Analytics</h1></div></div>
        <div className="analytics-state-card"><span className="analytics-state-icon">!</span><h2>Analytics unavailable</h2><p>{error}</p><button className="analytics-primary-btn" onClick={() => void loadAnalytics()}>Try again</button></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="analytics-page">
        <div className="analytics-header"><div><span className="analytics-kicker">PERFORMANCE CENTER</span><h1>Analytics</h1><p>Understand your creator growth and performance.</p></div></div>
        <div className="analytics-state-card"><span className="analytics-state-icon">↗</span><h2>Your insights will appear here</h2><p>Once your account has analytics data, you’ll see follower growth and engagement trends in this workspace.</p><button className="analytics-primary-btn" onClick={() => void loadAnalytics()}>Refresh data</button></div>
      </div>
    );
  }

  const { latest, previous, followerChange, followerChangePct, engagementChange, averageEngagement, bestMonth, totalChange, totalChangePct } = metrics;

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div className="analytics-heading-copy">
          <span className="analytics-kicker">PERFORMANCE CENTER</span>
          <h1>Analytics</h1>
          <p>Track your audience growth and understand what’s working.</p>
        </div>
        <div className="analytics-header-actions">
          <div className="analytics-range-switch" role="group" aria-label="Select analytics date range">
            {(['3M', '6M', 'ALL'] as Range[]).map((item) => (
              <button key={item} className={range === item ? 'is-active' : ''} onClick={() => setRange(item)} aria-pressed={range === item}>
                {item === 'ALL' ? 'All time' : item}
              </button>
            ))}
          </div>
          <button className="analytics-export-btn" onClick={() => downloadCsv(visibleData)} disabled={!visibleData.length}>
            <span aria-hidden="true">↓</span> Export CSV
          </button>
        </div>
      </header>

      <section className="analytics-welcome-strip">
        <div className="analytics-welcome-mark">✦</div>
        <div><strong>{user?.name ? `Keep growing, ${user.name.split(' ')[0]}` : 'Your creator performance at a glance'}</strong><span>Here’s how your profile performed over {rangeLabel}.</span></div>
        <span className="analytics-updated-label">LATEST: {latest.month}</span>
      </section>

      <section className="analytics-stats" aria-label="Key performance metrics">
        <article className="analytics-stat-card">
          <div className="analytics-stat-top"><span>Total followers</span><span className="analytics-stat-symbol">◎</span></div>
          <strong className="analytics-stat-value">{formatNumber(latest.followers)}</strong>
          <div className="analytics-stat-foot"><span className={followerChange >= 0 ? 'analytics-change-positive' : 'analytics-change-negative'}>{followerChange >= 0 ? '↗ +' : '↘ '}{formatNumber(followerChange)}</span><span>vs previous month</span></div>
        </article>
        <article className="analytics-stat-card">
          <div className="analytics-stat-top"><span>Engagement rate</span><span className="analytics-stat-symbol">✳</span></div>
          <strong className="analytics-stat-value">{latest.engagementRate.toFixed(1)}<small>%</small></strong>
          <div className="analytics-stat-foot"><span className={engagementChange >= 0 ? 'analytics-change-positive' : 'analytics-change-negative'}>{engagementChange >= 0 ? '↗ +' : '↘ '}{Math.abs(engagementChange).toFixed(1)} pp</span><span>vs previous month</span></div>
        </article>
        <article className="analytics-stat-card">
          <div className="analytics-stat-top"><span>Growth in period</span><span className="analytics-stat-symbol">↗</span></div>
          <strong className="analytics-stat-value">{totalChangePct >= 0 ? '+' : ''}{totalChangePct.toFixed(1)}<small>%</small></strong>
          <div className="analytics-stat-foot"><span className={totalChange >= 0 ? 'analytics-change-positive' : 'analytics-change-negative'}>{totalChange >= 0 ? '+' : ''}{formatNumber(totalChange)}</span><span>net new followers</span></div>
        </article>
        <article className="analytics-stat-card">
          <div className="analytics-stat-top"><span>Avg. engagement</span><span className="analytics-stat-symbol">◷</span></div>
          <strong className="analytics-stat-value">{averageEngagement.toFixed(1)}<small>%</small></strong>
          <div className="analytics-stat-foot"><span className="analytics-neutral-label">{visibleData.length} data points</span><span>selected period</span></div>
        </article>
      </section>

      <section className="analytics-chart-card analytics-main-chart">
        <div className="analytics-section-heading">
          <div><span className="analytics-section-eyebrow">AUDIENCE OVERVIEW</span><h2>Follower growth</h2><p>Your audience size over time</p></div>
          <div className="analytics-chart-legend"><span className="analytics-legend-dot" /> Followers</div>
        </div>
        <div className="analytics-chart-summary"><strong>{formatNumber(latest.followers)}</strong><span>followers in {latest.month}</span>{previous && <em className={followerChangePct >= 0 ? 'analytics-change-positive' : 'analytics-change-negative'}>{followerChangePct >= 0 ? '+' : ''}{followerChangePct.toFixed(1)}% MoM</em>}</div>
        <TrendChart points={visibleData} metric="followers" color="#ff806f" formatValue={formatNumber} />
      </section>

      <div className="analytics-lower-grid">
        <section className="analytics-chart-card analytics-engagement-card">
          <div className="analytics-section-heading">
            <div><span className="analytics-section-eyebrow">CONTENT QUALITY</span><h2>Engagement trend</h2><p>How actively your audience interacts</p></div>
            <div className="analytics-chart-legend analytics-legend-gold"><span className="analytics-legend-dot" /> Rate</div>
          </div>
          <div className="analytics-chart-summary"><strong>{latest.engagementRate.toFixed(1)}%</strong><span>latest engagement rate</span></div>
          <TrendChart points={visibleData} metric="engagementRate" color="#f3c66b" formatValue={(value) => `${value.toFixed(1)}%`} />
        </section>

        <section className="analytics-insights-card">
          <div className="analytics-section-heading"><div><span className="analytics-section-eyebrow">QUICK READ</span><h2>Performance insights</h2><p>Highlights from your selected period</p></div><span className="analytics-insight-sparkle">✦</span></div>
          <div className="analytics-insight-row"><span className="analytics-insight-icon">↗</span><div><strong>{bestMonth.month} was your strongest point</strong><p>Your highest recorded audience was {formatCompact(bestMonth.followers)} followers.</p></div></div>
          <div className="analytics-insight-row"><span className="analytics-insight-icon analytics-insight-icon-gold">◎</span><div><strong>{averageEngagement.toFixed(1)}% average engagement</strong><p>This is your average engagement rate across the selected data.</p></div></div>
          <div className="analytics-insight-row"><span className="analytics-insight-icon">＋</span><div><strong>{totalChange >= 0 ? 'Audience is growing' : 'Audience has dipped'}</strong><p>{formatNumber(Math.abs(totalChange))} {totalChange >= 0 ? 'net followers gained' : 'followers difference'} during this period.</p></div></div>
          <div className="analytics-insight-note">Insights are calculated from the analytics data currently connected to your account.</div>
        </section>
      </div>
      <footer className="analytics-footnote">Showing {visibleData.length} of {data.length} available monthly records · Data is provided by your connected VibeConnect analytics source.</footer>
    </div>
  );
}
