import { Link } from 'react-router-dom';
import './LandingPage.css';

const stats = [
  { label: 'Creator-brand matches', value: '2.4k+' },
  { label: 'Active campaigns', value: '180+' },
  { label: 'AI-assisted briefs', value: '99%' },
];

const pillars = [
  {
    title: 'For creators',
    text: 'Showcase your media kit, discover matched brand campaigns, and pitch faster with guided AI support.',
  },
  {
    title: 'For brands',
    text: 'Find the right creator fit, launch briefs in minutes, and move from scouting to campaign execution without friction.',
  },
  {
    title: 'For growth teams',
    text: 'Turn creator outreach, analytics, and messaging into one live operational dashboard.',
  },
];

const workflow = [
  'Create a polished creator or brand profile',
  'Use AI to turn outreach or campaign brief challenges into usable drafts',
  'Connect, collaborate, and launch with measurable momentum',
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <section className="landing-hero glass">
        <div className="landing-hero-copy">
          <span className="eyebrow">Market-ready creator-brand collaboration suite</span>
          <h1>Turn creator discovery into measurable brand growth.</h1>
          <p>
            VibeConnect is the all-in-one workspace for creators, brands, and growth teams to connect,
            collaborate, and convert campaigns with confidence.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="btn btn-primary">Open the product</Link>
            <a href="#platform" className="btn btn-ghost">Explore the platform</a>
          </div>
          <div className="landing-stats">
            {stats.map((item) => (
              <div key={item.label} className="landing-stat-card glass">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-showcase glass">
          <div className="showcase-card">
            <div className="showcase-row">
              <span className="pulse-dot" />
              <span>Live campaign intelligence</span>
            </div>
            <div className="showcase-grid">
              <div>
                <strong>94%</strong>
                <span>pitch acceptance</span>
              </div>
              <div>
                <strong>18 hrs</strong>
                <span>average setup time</span>
              </div>
              <div>
                <strong>AI</strong>
                <span>campaign brief assistant</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>creator-brand matching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="landing-grid">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="landing-card glass">
            <span className="eyebrow">{pillar.title}</span>
            <h2>{pillar.title}</h2>
            <p>{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="landing-section glass">
        <div className="landing-section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h2>From profile to campaign in one clean workflow</h2>
          </div>
        </div>
        <div className="landing-steps">
          {workflow.map((step, index) => (
            <div key={step} className="landing-step">
              <span className="step-number">0{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta glass">
        <div>
          <span className="eyebrow">Ready to launch</span>
          <h2>Ship the product, onboard real users, and grow faster with your AI co-pilot.</h2>
        </div>
        <Link to="/signup" className="btn btn-primary">Create your workspace</Link>
      </section>
    </div>
  );
}
