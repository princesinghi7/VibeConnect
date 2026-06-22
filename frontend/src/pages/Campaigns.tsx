import { useEffect, useState, type FormEvent } from 'react';
import CampaignCard from '../components/CampaignCard';
import { useAuth } from '../hooks/useAuth';
import { getCampaigns, createCampaign } from '../api/services';
import type { Campaign } from '../api/types';
import './Campaigns.css';

const empty = { title: '', description: '', niche: 'Relatable Content', budget: '', deliverables: '', platform: 'Instagram', deadline: '' };

export default function Campaigns() {
  const { user } = useAuth();
  const isBrand = user?.accountType === 'brand';
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCampaigns().then((c) => { setCampaigns(c); setLoading(false); });
  }, []);

  function updateInList(updated: Campaign) {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await createCampaign(form);
      setCampaigns((prev) => [created, ...prev]);
      setForm(empty);
      setShowForm(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="campaigns-page">
      <div className="campaigns-header">
        <div>
          <h1>Campaigns</h1>
          <p className="eyebrow">{isBrand ? 'Post briefs and manage applicants' : 'Open collab opportunities from brands'}</p>
        </div>
        {isBrand && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New campaign'}
          </button>
        )}
      </div>

      {showForm && (
        <form className="campaign-form glass" onSubmit={onCreate}>
          <div className="campaign-form-grid">
            <label className="auth-field">
              <span>Title</span>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="GRWM featuring our new serum" />
            </label>
            <label className="auth-field">
              <span>Niche</span>
              <select value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>
                {['Relatable Content', 'Lifestyle', 'Tech', 'Comedy', 'Fitness'].map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label className="auth-field">
              <span>Budget</span>
              <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="₹25,000" />
            </label>
            <label className="auth-field">
              <span>Platform</span>
              <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Instagram" />
            </label>
            <label className="auth-field">
              <span>Deliverables</span>
              <input value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="1 Reel + 2 Stories" />
            </label>
            <label className="auth-field">
              <span>Deadline</span>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </label>
          </div>
          <label className="auth-field">
            <span>Description</span>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What you want the creator to make, and why it fits your brand." />
          </label>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post campaign'}</button>
        </form>
      )}

      {loading ? (
        <div className="campaigns-grid">{[1, 2].map((i) => <div className="skeleton" style={{ height: 220 }} key={i} />)}</div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map((c) => (
            <CampaignCard
              campaign={c}
              key={c.id}
              viewerRole={isBrand ? 'brand' : 'creator'}
              viewerId={user?.id ?? ''}
              onApplied={updateInList}
            />
          ))}
          {campaigns.length === 0 && <p className="eyebrow">No campaigns yet.</p>}
        </div>
      )}
    </div>
  );
}
