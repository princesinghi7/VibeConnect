import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import {
  getFeed,
  getConnections,
  getCampaigns,
  getBrands,
  getCreators,
  getThreads,
} from '../api/services';
import type {
  Post,
  Connection,
  Campaign,
  BrandCard,
  CreatorCard,
  ChatThread,
} from '../api/types';
import './Dashboard.css';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);

export default function Dashboard() {
  const { user } = useAuth();
  const isBrand = user?.accountType === 'brand';

  const [posts, setPosts] = useState<Post[]>([]);
  const [, setConnections] = useState<Connection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brands, setBrands] = useState<BrandCard[]>([]);
  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [feedData, connectionData, campaignData, threadData, brandData, creatorData] =
          await Promise.all([
            getFeed(),
            getConnections(),
            getCampaigns(),
            getThreads(),
            getBrands(),
            getCreators(),
          ]);

        if (!active) return;
        setPosts(feedData.slice(0, 2));
        setConnections(connectionData);
        setCampaigns(campaignData);
        setThreads(threadData);
        setBrands(brandData);
        setCreators(creatorData);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, []);

  const myCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.brandId === user?.id),
    [campaigns, user?.id],
  );

  const myApplications = useMemo(
    () => campaigns.filter((campaign) =>
      campaign.applicants.some((applicant) => applicant.creatorId === user?.id),
    ),
    [campaigns, user?.id],
  );

  const activeCampaigns = isBrand
    ? myCampaigns.filter((campaign) => campaign.status === 'open')
    : campaigns.filter((campaign) => campaign.status === 'open');

  const pendingApplications = isBrand
    ? myCampaigns.reduce((total, campaign) =>
        total + campaign.applicants.filter((applicant) => applicant.status === 'applied').length, 0)
    : myApplications.filter((campaign) =>
        campaign.applicants.some((applicant) => applicant.creatorId === user?.id && applicant.status === 'applied'),
      ).length;

  const unreadMessages = threads.reduce((total, thread) => total + thread.unread, 0);

  if (!user) return null;

  const stats = isBrand
    ? [
        { label: 'My campaigns', value: myCampaigns.length, icon: '◈', note: `${activeCampaigns.length} currently open` },
        { label: 'Applicants to review', value: pendingApplications, icon: '↗', note: 'Keep your campaigns moving' },
        { label: 'Creators to discover', value: creators.length, icon: '◎', note: 'Matched to your platform' },
        { label: 'Unread messages', value: unreadMessages, icon: '✉', note: 'Creator conversations' },
      ]
    : [
        { label: 'Open opportunities', value: activeCampaigns.length, icon: '◈', note: 'Campaigns accepting creators' },
        { label: 'My applications', value: myApplications.length, icon: '↗', note: `${pendingApplications} awaiting a response` },
        { label: 'Brand partners', value: brands.length, icon: '◎', note: 'Brands on VibeConnect' },
        { label: 'Unread messages', value: unreadMessages, icon: '✉', note: 'Brand conversations' },
      ];

  const recommendations = isBrand ? creators.slice(0, 3) : brands.slice(0, 3);

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <span className="dashboard-kicker">VIBECONNECT / WORKSPACE</span>
          <h1>Good to see you, {user.name.split(' ')[0]} <span aria-hidden="true">✦</span></h1>
          <p>{isBrand
            ? 'Build meaningful partnerships with creators who move your brand forward.'
            : 'Your next great brand collaboration could start with one small step.'}</p>
        </div>
        <div className="dashboard-top-actions">
          <span className="dashboard-date">{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span>
          <Link to="/profile" className="dashboard-avatar-link" aria-label="Open profile">
            <Avatar src={user.avatarUrl} name={user.name} size={44} status={user.status} />
          </Link>
        </div>
      </header>

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-pill"><span /> YOUR CREATOR ECONOMY, CONNECTED</span>
          <h2>{isBrand ? 'Find the voice your brand is missing.' : 'Turn your content into meaningful collaborations.'}</h2>
          <p>{isBrand
            ? 'Discover relevant talent, publish a campaign and manage every partnership from one place.'
            : 'Explore brands, apply to campaigns and keep every collaboration organised in one workspace.'}</p>
          <div className="dashboard-hero-actions">
            <Link to={isBrand ? '/discover' : '/campaigns'} className="dashboard-primary-btn">
              {isBrand ? 'Discover creators' : 'Explore campaigns'} <span>↗</span>
            </Link>
            <Link to={isBrand ? '/campaigns' : '/discover'} className="dashboard-secondary-btn">
              {isBrand ? 'Manage campaigns' : 'Discover brands'}
            </Link>
          </div>
        </div>
        <div className="dashboard-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-center">V<span>✦</span></div>
          <div className="hero-float hero-float-one">✳</div>
          <div className="hero-float hero-float-two">↗</div>
          <div className="hero-float hero-float-three">◎</div>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Workspace statistics">
        {stats.map((stat) => (
          <article className="dashboard-stat-card" key={stat.label}>
            <div className="dashboard-stat-top">
              <span>{stat.label}</span>
              <span className="dashboard-stat-icon">{stat.icon}</span>
            </div>
            <strong>{loading ? '—' : formatNumber(stat.value)}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>

      <div className="dashboard-content-grid">
        <main className="dashboard-main-column">
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">MAKE YOUR NEXT MOVE</span>
                <h2>{isBrand ? 'Campaign workspace' : 'Recommended opportunities'}</h2>
              </div>
              <Link to={isBrand ? '/campaigns' : '/discover'}>View all <span>↗</span></Link>
            </div>

            {loading ? (
              <div className="dashboard-loading-card">Loading your workspace…</div>
            ) : isBrand ? (
              <div className="dashboard-campaign-list">
                {myCampaigns.slice(0, 3).map((campaign) => (
                  <article className="dashboard-campaign-row" key={campaign.id}>
                    <div className="campaign-row-mark">✳</div>
                    <div className="campaign-row-info">
                      <strong>{campaign.title}</strong>
                      <span>{campaign.niche} · {campaign.platform} · {campaign.budget}</span>
                    </div>
                    <span className={`campaign-status ${campaign.status}`}>{campaign.status}</span>
                  </article>
                ))}
                {myCampaigns.length === 0 && (
                  <div className="dashboard-empty">
                    <strong>Your first campaign starts here.</strong>
                    <span>Publish a clear brief to start receiving creator applications.</span>
                    <Link to="/campaigns">Create a campaign ↗</Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="dashboard-opportunity-grid">
                {campaigns.filter((campaign) => campaign.status === 'open').slice(0, 2).map((campaign) => (
                  <article className="dashboard-opportunity-card" key={campaign.id}>
                    <div className="opportunity-card-top">
                      <span className="opportunity-category">{campaign.niche}</span>
                      <span className="opportunity-open">● Open</span>
                    </div>
                    <h3>{campaign.title}</h3>
                    <p>{campaign.description}</p>
                    <div className="opportunity-meta">
                      <span>{campaign.platform}</span>
                      <strong>{campaign.budget}</strong>
                    </div>
                    <Link to="/campaigns">View campaign <span>↗</span></Link>
                  </article>
                ))}
                {campaigns.filter((campaign) => campaign.status === 'open').length === 0 && (
                  <div className="dashboard-empty">
                    <strong>New opportunities are on the way.</strong>
                    <span>Complete your profile and check back for fresh campaigns.</span>
                    <Link to="/profile">Update your profile ↗</Link>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">YOUR COMMUNITY</span>
                <h2>Latest from your network</h2>
              </div>
              <Link to="/feed">Open feed <span>↗</span></Link>
            </div>
            {loading ? (
              <div className="dashboard-loading-card">Loading recent updates…</div>
            ) : posts.length ? (
              <div className="dashboard-feed-list">
                {posts.map((post) => (
                  <article className="dashboard-feed-item" key={post.id}>
                    <Avatar src={post.author.avatarUrl} name={post.author.name} size={40} />
                    <div>
                      <div className="feed-author-line"><strong>{post.author.name}</strong><span>{post.author.handle}</span></div>
                      <p>{post.content}</p>
                      <small>{post.likes} likes · {post.comments.length} comments</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty"><strong>Your network is quiet for now.</strong><span>Follow creators and brands to see updates here.</span></div>
            )}
          </section>
        </main>

        <aside className="dashboard-side-column">
          <section className="dashboard-side-card">
            <div className="dashboard-section-heading compact">
              <div><span className="dashboard-kicker">GOOD MATCHES</span><h2>{isBrand ? 'Creators to explore' : 'Brands to explore'}</h2></div>
            </div>
            {loading ? <div className="dashboard-loading-card">Finding matches…</div> : recommendations.map((item) => (
              <div className="dashboard-match-row" key={item.id}>
                <Avatar src={item.avatarUrl} name={isBrand ? (item as CreatorCard).name : (item as BrandCard).companyName} size={38} />
                <div className="dashboard-match-info">
                  <strong>{isBrand ? (item as CreatorCard).name : (item as BrandCard).companyName}</strong>
                  <span>{isBrand ? (item as CreatorCard).niche : (item as BrandCard).industry}</span>
                </div>
                <span className="match-arrow">↗</span>
              </div>
            ))}
            <Link to="/discover" className="dashboard-side-link">Explore {isBrand ? 'creators' : 'brands'} <span>↗</span></Link>
          </section>

          <section className="dashboard-side-card profile-progress-card">
            <span className="dashboard-kicker">YOUR PRESENCE</span>
            <h2>Make your profile work harder.</h2>
            <p>A complete profile helps the right partners understand your value before they reach out.</p>
            <div className="profile-progress-track"><span style={{ width: user.bio && user.avatarUrl ? '72%' : '38%' }} /></div>
            <div className="profile-progress-caption"><span>Profile strength</span><strong>{user.bio && user.avatarUrl ? '72%' : '38%'}</strong></div>
            <Link to="/profile" className="dashboard-side-link">Improve profile <span>↗</span></Link>
          </section>

          <section className="dashboard-side-card quick-links-card">
            <span className="dashboard-kicker">QUICK ACCESS</span>
            <Link to="/messages"><span className="quick-link-icon">✉</span> Messages <span className="quick-link-arrow">↗</span></Link>
            <Link to="/analytics"><span className="quick-link-icon">▥</span> Analytics <span className="quick-link-arrow">↗</span></Link>
            <Link to="/ai-assistant"><span className="quick-link-icon">✧</span> AI Assistant <span className="quick-link-arrow">↗</span></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
