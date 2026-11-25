import { useEffect, useMemo, useState, type FormEvent } from 'react';
import CampaignCard from '../components/CampaignCard';
import { useAuth } from '../hooks/useAuth';
import { getCampaigns, createCampaign } from '../api/services';
import type { Campaign } from '../api/types';
import './Campaigns.css';

type CampaignForm = { title: string; description: string; niche: string; budget: string; deliverables: string; platform: string; deadline: string };
const emptyForm: CampaignForm = { title: '', description: '', niche: 'Lifestyle', budget: '', deliverables: '', platform: 'Instagram', deadline: '' };
const niches = ['All niches', 'Lifestyle', 'Relatable Content', 'Tech', 'Comedy', 'Fitness', 'Beauty', 'Food', 'Travel', 'Gaming'];
const platforms = ['Instagram', 'YouTube', 'TikTok', 'Multi-platform'];

export default function Campaigns() {
  const { user } = useAuth();
  const isBrand = user?.accountType === 'brand';
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('All niches');
  const [platform, setPlatform] = useState('All platforms');
  const [sort, setSort] = useState('newest');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    let active = true;
    getCampaigns()
      .then((items) => { if (active) setCampaigns(items); })
      .catch(() => { if (active) setLoadError('We could not load campaigns. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function updateInList(updated: Campaign) {
    setCampaigns((previous) => previous.map((item) => item.id === updated.id ? updated : item));
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (form.deadline && form.deadline < new Date().toISOString().slice(0, 10)) {
      setFormError('Please choose a future deadline.');
      return;
    }
    setBusy(true);
    try {
      const created = await createCampaign(form);
      setCampaigns((previous) => [created, ...previous]);
      setForm(emptyForm);
      setShowForm(false);
      setTab('all');
    } catch {
      setFormError('Campaign could not be published. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const myApplications = useMemo(() => campaigns.filter((campaign) => campaign.applicants.some((applicant) => applicant.creatorId === user?.id)), [campaigns, user?.id]);
  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = campaigns.filter((campaign) => {
      const matchesSearch = !query || [campaign.title, campaign.brandName, campaign.description, campaign.niche].some((value) => value.toLowerCase().includes(query));
      const matchesNiche = niche === 'All niches' || campaign.niche.toLowerCase() === niche.toLowerCase();
      const matchesPlatform = platform === 'All platforms' || campaign.platform.toLowerCase() === platform.toLowerCase();
      const matchesTab = isBrand ? (tab === 'all' || (tab === 'open' ? campaign.status === 'open' : campaign.status === 'closed')) : (tab === 'all' || (tab === 'open' ? campaign.status === 'open' : myApplications.some((item) => item.id === campaign.id)));
      return matchesSearch && matchesNiche && matchesPlatform && matchesTab;
    });
    if (sort === 'budget-high') result = [...result].sort((a, b) => budgetValue(b.budget) - budgetValue(a.budget));
    else if (sort === 'deadline') result = [...result].sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
    else if (sort === 'name') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    else result = [...result].reverse();
    return result;
  }, [campaigns, search, niche, platform, sort, tab, isBrand, myApplications]);

  const openCount = campaigns.filter((campaign) => campaign.status === 'open').length;
  const applicantCount = campaigns.reduce((total, campaign) => total + campaign.applicants.length, 0);

  return (
    <main className="campaigns-page">
      <section className="campaigns-hero">
        <div className="campaigns-hero-copy">
          <span className="campaigns-kicker">VIBECONNECT MARKETPLACE</span>
          <h1>{isBrand ? 'Campaign workspace' : 'Find your next collaboration'}</h1>
          <p>{isBrand ? 'Create opportunities, review interest and keep every partnership moving.' : 'Discover paid brand opportunities that match your content, audience and creative style.'}</p>
        </div>
        {isBrand && <button className="campaign-primary-btn" onClick={() => { setShowForm((value) => !value); setFormError(''); }}>{showForm ? 'Close form' : '+ Create campaign'}</button>}
      </section>

      <section className="campaign-metrics" aria-label="Campaign overview">
        <div className="campaign-metric"><span className="metric-icon">◈</span><div><strong>{campaigns.length}</strong><span>Total campaigns</span></div></div>
        <div className="campaign-metric"><span className="metric-icon">↗</span><div><strong>{openCount}</strong><span>Open opportunities</span></div></div>
        <div className="campaign-metric"><span className="metric-icon">♧</span><div><strong>{isBrand ? applicantCount : myApplications.length}</strong><span>{isBrand ? 'Total applicants' : 'Your applications'}</span></div></div>
      </section>

      {showForm && isBrand && (
        <form className="campaign-create-panel" onSubmit={onCreate}>
          <div className="campaign-panel-heading"><div><span className="campaigns-kicker">NEW OPPORTUNITY</span><h2>Build a campaign brief</h2><p>Give creators the details they need to apply with confidence.</p></div><span className="campaign-form-step">01 / BRIEF</span></div>
          <div className="campaign-form-grid">
            <label className="campaign-field campaign-field-wide"><span>Campaign title *</span><input required maxLength={90} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Launch our summer collection" /></label>
            <label className="campaign-field"><span>Creator niche *</span><select value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })}>{niches.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="campaign-field"><span>Platform *</span><select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>{platforms.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="campaign-field"><span>Campaign budget</span><input value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} placeholder="e.g. ₹25,000" /></label>
            <label className="campaign-field"><span>Deliverables</span><input value={form.deliverables} onChange={(event) => setForm({ ...form, deliverables: event.target.value })} placeholder="1 Reel + 2 Stories" /></label>
            <label className="campaign-field"><span>Application deadline</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label>
            <label className="campaign-field campaign-field-wide"><span>Campaign description *</span><textarea required minLength={20} maxLength={1200} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe your product, campaign goals, creative direction and what a successful collaboration looks like." /><small>{form.description.length}/1200 characters</small></label>
          </div>
          {formError && <p className="campaign-form-error" role="alert">{formError}</p>}
          <div className="campaign-form-footer"><span>Fields marked * are required</span><button type="submit" className="campaign-primary-btn" disabled={busy}>{busy ? 'Publishing…' : 'Publish campaign ↗'}</button></div>
        </form>
      )}

      <section className="campaign-browser">
        <div className="campaign-browser-heading"><div><h2>{isBrand ? 'Manage campaigns' : 'Explore opportunities'}</h2><p>{isBrand ? 'Track your published briefs and incoming creator interest.' : 'A curated space for your next brand partnership.'}</p></div><span className="campaign-results-count">{filteredCampaigns.length} results</span></div>
        <div className="campaign-toolbar">
          <label className="campaign-search"><span>⌕</span><input aria-label="Search campaigns" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaigns, brands or keywords" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label>
          <select aria-label="Filter by niche" value={niche} onChange={(event) => setNiche(event.target.value)}>{niches.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by platform" value={platform} onChange={(event) => setPlatform(event.target.value)}>{['All platforms', ...platforms].map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Sort campaigns" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="budget-high">Highest budget</option><option value="deadline">Closing soon</option><option value="name">Campaign name</option></select>
        </div>
        <div className="campaign-tabs" role="tablist" aria-label="Campaign status filters">
          {(isBrand ? [{ id: 'all', label: 'All campaigns' }, { id: 'open', label: 'Open' }, { id: 'closed', label: 'Closed' }] : [{ id: 'all', label: 'All opportunities' }, { id: 'open', label: 'Open now' }, { id: 'applied', label: `Applied (${myApplications.length})` }]).map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
        </div>

        {loading ? <div className="campaigns-grid campaign-skeleton-grid">{[1, 2, 3, 4].map((item) => <div className="campaign-skeleton" key={item} />)}</div> : loadError ? <div className="campaign-empty"><span>!</span><h3>Something went wrong</h3><p>{loadError}</p><button className="campaign-secondary-btn" onClick={() => { setLoading(true); setLoadError(''); getCampaigns().then(setCampaigns).catch(() => setLoadError('We could not load campaigns. Please try again.')).finally(() => setLoading(false)); }}>Try again</button></div> : filteredCampaigns.length ? <div className="campaigns-grid">{filteredCampaigns.map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} viewerRole={isBrand ? 'brand' : 'creator'} viewerId={user?.id ?? ''} onApplied={updateInList} />)}</div> : <div className="campaign-empty"><span>⌕</span><h3>No matching campaigns</h3><p>Try changing your search or filters to discover more opportunities.</p><button className="campaign-secondary-btn" onClick={() => { setSearch(''); setNiche('All niches'); setPlatform('All platforms'); setTab('all'); }}>Clear all filters</button></div>}
      </section>
      <p className="campaign-footer-note">A better way for creators and brands to build meaningful partnerships.</p>
    </main>
  );
}

function budgetValue(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
