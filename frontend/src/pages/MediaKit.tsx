import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { addPortfolioItem, getPortfolio, getRateCard, saveRateCard } from '../api/services';
import type { PortfolioItem, RateCardItem } from '../api/types';
import { useAuth } from '../hooks/useAuth';
import './MediaKit.css';

type NewPortfolioItem = { title: string; brand: string; metric: string; imageUrl: string; link: string };
const emptyItem: NewPortfolioItem = { title: '', brand: 'Personal', metric: '', imageUrl: '', link: '' };

function formatMoney(price: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `₹${price.toLocaleString('en-IN')}`;
  }
}

function socialUrl(value?: string, platform?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (platform === 'instagram') return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
  if (platform === 'youtube') return `https://youtube.com/${trimmed.startsWith('@') ? trimmed : `@${trimmed}`}`;
  if (platform === 'facebook') return `https://facebook.com/${trimmed.replace(/^@/, '')}`;
  if (platform === 'twitter') return `https://x.com/${trimmed.replace(/^@/, '')}`;
  return undefined;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'VC';
}

export default function MediaKit() {
  const { user } = useAuth();
  const [rateCard, setRateCard] = useState<RateCardItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingRates, setEditingRates] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [rateError, setRateError] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [itemError, setItemError] = useState('');
  const [newItem, setNewItem] = useState<NewPortfolioItem>(emptyItem);
  const [savedFlash, setSavedFlash] = useState('');

  const loadMediaKit = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [rates, work] = await Promise.all([getRateCard(), getPortfolio()]);
      setRateCard(rates);
      setPortfolio(work);
    } catch {
      setLoadError('We could not load your media kit. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMediaKit(); }, [loadMediaKit]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = window.setTimeout(() => setSavedFlash(''), 2600);
    return () => window.clearTimeout(timer);
  }, [savedFlash]);

  const totalStartingPrice = useMemo(
    () => rateCard.length ? Math.min(...rateCard.map((item) => item.price).filter((price) => Number.isFinite(price) && price >= 0)) : 0,
    [rateCard],
  );

  function updateRate(id: string, patch: Partial<RateCardItem>) {
    setRateCard((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function addRateRow() {
    setRateCard((current) => [...current, { id: `rate-${Date.now()}`, platform: 'Instagram', format: '', price: 0, currency: 'INR', notes: '' }]);
  }

  function cancelRateEdit() {
    setEditingRates(false);
    setRateError('');
    void loadMediaKit();
  }

  async function saveRates() {
    const invalid = rateCard.some((item) => !item.platform.trim() || !item.format.trim() || !Number.isFinite(item.price) || item.price < 0);
    if (invalid) {
      setRateError('Add a platform and format, and enter a valid non-negative price for every row.');
      return;
    }
    setSavingRates(true);
    setRateError('');
    try {
      const saved = await saveRateCard(rateCard);
      setRateCard(saved);
      setEditingRates(false);
      setSavedFlash('Rate card saved successfully.');
    } catch {
      setRateError('Your rate card could not be saved. Please try again.');
    } finally {
      setSavingRates(false);
    }
  }

  async function onAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setItemError('');
    setAddingItem(true);
    try {
      const item = await addPortfolioItem({
        title: newItem.title.trim(),
        brand: newItem.brand.trim() || 'Personal',
        metric: newItem.metric.trim(),
        imageUrl: newItem.imageUrl.trim(),
        link: newItem.link.trim() || undefined,
      });
      setPortfolio((current) => [...current, item]);
      setNewItem(emptyItem);
      setShowAddItem(false);
      setSavedFlash('Work sample added to your media kit.');
    } catch {
      setItemError('Could not add this work sample. Please try again.');
    } finally {
      setAddingItem(false);
    }
  }

  if (loading) {
    return <div className="mediakit-page"><div className="mediakit-skeleton mediakit-skeleton-heading" /><div className="mediakit-skeleton mediakit-skeleton-hero" /><div className="mediakit-skeleton mediakit-skeleton-section" /><div className="mediakit-skeleton mediakit-skeleton-section" /></div>;
  }

  if (loadError) {
    return <div className="mediakit-page"><header className="mediakit-page-heading"><div><span className="mediakit-kicker">CREATOR TOOLKIT</span><h1>Media kit</h1></div></header><div className="mediakit-empty-state"><span className="mediakit-empty-icon">!</span><h2>Media kit unavailable</h2><p>{loadError}</p><button className="mediakit-button mediakit-button-primary" onClick={() => void loadMediaKit()}>Try again</button></div></div>;
  }

  const displayName = user?.name || 'Your creator name';
  const socials = [
    { label: 'Instagram', value: user?.socials?.instagram, url: socialUrl(user?.socials?.instagram, 'instagram') },
    { label: 'YouTube', value: user?.socials?.youtube, url: socialUrl(user?.socials?.youtube, 'youtube') },
    { label: 'Facebook', value: user?.socials?.facebook, url: socialUrl(user?.socials?.facebook, 'facebook') },
    { label: 'X', value: user?.socials?.twitter, url: socialUrl(user?.socials?.twitter, 'twitter') },
  ].filter((item) => item.value);

  return (
    <div className="mediakit-page">
      <header className="mediakit-page-heading">
        <div><span className="mediakit-kicker">CREATOR TOOLKIT</span><h1>Media kit</h1><p>Your professional snapshot for brand partnerships and collaboration enquiries.</p></div>
        <div className="mediakit-heading-actions"><span className="mediakit-ready-indicator"><i /> Share-ready profile</span><button className="mediakit-button mediakit-button-primary" onClick={() => window.print()}><span aria-hidden="true">↗</span> Download / Print kit</button></div>
      </header>

      {savedFlash && <div className="mediakit-flash" role="status"><span>✓</span>{savedFlash}</div>}

      <section className="mediakit-profile-card">
        <div className="mediakit-profile-cover" />
        <div className="mediakit-profile-content">
          <div className="mediakit-avatar-wrap">{user?.avatarUrl ? <img className="mediakit-avatar" src={user.avatarUrl} alt={`${displayName} profile`} /> : <div className="mediakit-avatar mediakit-avatar-fallback">{initials(displayName)}</div>}</div>
          <div className="mediakit-profile-main">
            <div className="mediakit-profile-title"><div><span className="mediakit-profile-label">CREATOR PROFILE</span><h2>{displayName}</h2><span className="mediakit-handle">{user?.handle ? `@${user.handle.replace(/^@/, '')}` : 'Add your handle in profile settings'}</span></div><span className="mediakit-profile-pill">Available for collaborations</span></div>
            <p className="mediakit-bio">{user?.bio || 'Add a short creator bio to tell brands what makes your content unique.'}</p>
            <div className="mediakit-profile-meta"><span>⌖ {user?.location || 'Location not added'}</span><span>✦ {user?.niche || user?.role || 'Creator'}</span></div>
            <div className="mediakit-social-links">{socials.length ? socials.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noreferrer">{social.label} ↗</a>) : <span>Add your social links in profile settings to help brands discover your channels.</span>}</div>
          </div>
          <div className="mediakit-audience-summary"><div><span>FOLLOWERS</span><strong>{typeof user?.followers === 'number' ? user.followers.toLocaleString('en-IN') : '—'}</strong></div><div><span>ENGAGEMENT</span><strong>{typeof user?.engagementRate === 'number' ? `${user.engagementRate}%` : '—'}</strong></div><div><span>PORTFOLIO</span><strong>{portfolio.length.toString().padStart(2, '0')}</strong></div></div>
        </div>
      </section>

      <div className="mediakit-section-grid">
        <section className="mediakit-section mediakit-rate-section">
          <div className="mediakit-section-head"><div><span className="mediakit-section-kicker">PARTNERSHIP PRICING</span><h2>Rate card</h2><p>Transparent starting rates for your content deliverables.</p></div>{!editingRates ? <button className="mediakit-button mediakit-button-secondary" onClick={() => setEditingRates(true)}>✎ Edit rates</button> : <div className="mediakit-inline-actions"><button className="mediakit-button mediakit-button-secondary" onClick={cancelRateEdit} disabled={savingRates}>Cancel</button><button className="mediakit-button mediakit-button-primary" onClick={() => void saveRates()} disabled={savingRates}>{savingRates ? 'Saving…' : 'Save changes'}</button></div>}</div>
          {rateError && <div className="mediakit-form-error" role="alert">{rateError}</div>}
          {rateCard.length ? <div className="mediakit-rate-table-wrap"><table className="mediakit-rate-table"><thead><tr><th>PLATFORM</th><th>DELIVERABLE</th><th>STARTING PRICE</th>{editingRates && <th aria-label="Actions" />}</tr></thead><tbody>{rateCard.map((item) => <tr key={item.id}>{editingRates ? <><td><input aria-label="Platform" value={item.platform} onChange={(event) => updateRate(item.id, { platform: event.target.value })} placeholder="Instagram" /></td><td><input aria-label="Deliverable" value={item.format} onChange={(event) => updateRate(item.id, { format: event.target.value })} placeholder="Reel (30-60 sec)" /><input className="mediakit-notes-input" aria-label="Notes" value={item.notes ?? ''} onChange={(event) => updateRate(item.id, { notes: event.target.value })} placeholder="Optional notes" /></td><td><div className="mediakit-price-input"><span>₹</span><input aria-label="Price in rupees" type="number" min="0" step="500" value={item.price} onChange={(event) => updateRate(item.id, { price: Number(event.target.value) })} /></div></td><td><button className="mediakit-remove-btn" onClick={() => setRateCard((current) => current.filter((rate) => rate.id !== item.id))} aria-label={`Remove ${item.format || 'rate'} row`}>×</button></td></> : <><td><span className="mediakit-platform-chip">{item.platform}</span></td><td><strong className="mediakit-deliverable">{item.format}</strong>{item.notes && <span className="mediakit-rate-note">{item.notes}</span>}</td><td><strong className="mediakit-price">{formatMoney(item.price, item.currency)}</strong></td></>}</tr>)}</tbody></table></div> : <div className="mediakit-section-empty"><strong>No rates added yet</strong><span>Add your first deliverable to help brands understand your pricing.</span></div>}
          {editingRates && <button className="mediakit-add-row" onClick={addRateRow}>＋ Add a deliverable</button>}
          {!editingRates && rateCard.length > 0 && <div className="mediakit-rate-footnote">{formatMoney(totalStartingPrice)} starting rate · Final pricing may vary by campaign scope.</div>}
        </section>

        <aside className="mediakit-side-column">
          <section className="mediakit-highlight-card"><span className="mediakit-section-kicker">YOUR VALUE</span><h2>Make every collaboration count.</h2><p>A clear media kit helps brands understand your audience, content style and partnership options.</p><div className="mediakit-highlight-stat"><span>AVERAGE ENGAGEMENT</span><strong>{typeof user?.engagementRate === 'number' ? `${user.engagementRate}%` : 'Add your stats'}</strong></div></section>
          <section className="mediakit-tip-card"><span className="mediakit-tip-icon">✦</span><div><strong>Keep your kit updated</strong><p>Refresh your audience numbers, rates and best work regularly so brands always see your latest profile.</p></div></section>
        </aside>
      </div>

      <section className="mediakit-section mediakit-portfolio-section">
        <div className="mediakit-section-head"><div><span className="mediakit-section-kicker">SELECTED WORK</span><h2>Portfolio</h2><p>Showcase content that represents your creative style and results.</p></div><button className="mediakit-button mediakit-button-secondary" onClick={() => { setShowAddItem((current) => !current); setItemError(''); }}>{showAddItem ? 'Cancel' : '＋ Add work sample'}</button></div>
        {showAddItem && <form className="mediakit-portfolio-form" onSubmit={(event) => void onAddItem(event)}><div className="mediakit-form-heading"><strong>Add a portfolio project</strong><span>Use a public image URL and include real performance results when available.</span></div><label>Project title<input required maxLength={90} placeholder="e.g. College life – relatable reel" value={newItem.title} onChange={(event) => setNewItem((current) => ({ ...current, title: event.target.value }))} /></label><label>Brand / client<input maxLength={70} placeholder="Personal or brand name" value={newItem.brand} onChange={(event) => setNewItem((current) => ({ ...current, brand: event.target.value }))} /></label><label>Performance result<input maxLength={80} placeholder="e.g. 120K views · 8K likes" value={newItem.metric} onChange={(event) => setNewItem((current) => ({ ...current, metric: event.target.value }))} /></label><label>Thumbnail image URL<input type="url" placeholder="https://… (optional)" value={newItem.imageUrl} onChange={(event) => setNewItem((current) => ({ ...current, imageUrl: event.target.value }))} /></label><label className="mediakit-form-wide">Content link<input type="url" placeholder="https://instagram.com/reel/… (optional)" value={newItem.link} onChange={(event) => setNewItem((current) => ({ ...current, link: event.target.value }))} /></label>{itemError && <div className="mediakit-form-error mediakit-form-wide" role="alert">{itemError}</div>}<div className="mediakit-form-actions mediakit-form-wide"><button type="button" className="mediakit-button mediakit-button-secondary" onClick={() => setShowAddItem(false)}>Cancel</button><button className="mediakit-button mediakit-button-primary" disabled={addingItem}>{addingItem ? 'Adding…' : 'Add to portfolio'}</button></div></form>}
        {portfolio.length ? <div className="mediakit-portfolio-grid">{portfolio.map((item) => <article className="mediakit-portfolio-card" key={item.id}><div className="mediakit-portfolio-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="mediakit-image-fallback">VC</div>}<span>{item.brand || 'Personal'}</span></div><div className="mediakit-portfolio-copy"><h3>{item.title}</h3><p>{item.metric || 'Performance details not added'}</p>{item.link && <a href={item.link} target="_blank" rel="noreferrer">View content ↗</a>}</div></article>)}</div> : <div className="mediakit-section-empty"><strong>Your portfolio starts here</strong><span>Add selected posts, brand collaborations or creator projects to showcase your work.</span></div>}
      </section>
      <footer className="mediakit-footer"><span>VIBECONNECT · CREATOR MEDIA KIT</span><span>Built to make meaningful partnerships happen.</span></footer>
    </div>
  );
}
