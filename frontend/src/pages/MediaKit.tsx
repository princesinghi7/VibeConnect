import { useEffect, useState, type FormEvent } from 'react';
import { getRateCard, saveRateCard, getPortfolio, addPortfolioItem } from '../api/services';
import type { RateCardItem, PortfolioItem } from '../api/types';
import './MediaKit.css';

export default function MediaKit() {
  const [rateCard, setRateCard] = useState<RateCardItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRates, setEditingRates] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', brand: 'Personal', metric: '', imageUrl: '' });

  useEffect(() => {
    Promise.all([getRateCard(), getPortfolio()]).then(([r, p]) => {
      setRateCard(r); setPortfolio(p); setLoading(false);
    });
  }, []);

  function updateRate(id: string, patch: Partial<RateCardItem>) {
    setRateCard((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRateRow() {
    setRateCard((prev) => [...prev, { id: `r${Date.now()}`, platform: '', format: '', price: 0, currency: 'INR' }]);
  }

  function removeRateRow(id: string) {
    setRateCard((prev) => prev.filter((r) => r.id !== id));
  }

  async function saveRates() {
    setSavingRates(true);
    try {
      const saved = await saveRateCard(rateCard);
      setRateCard(saved);
      setEditingRates(false);
    } finally {
      setSavingRates(false);
    }
  }

  async function onAddItem(e: FormEvent) {
    e.preventDefault();
    const item = await addPortfolioItem({
      ...newItem,
      imageUrl: newItem.imageUrl || `https://picsum.photos/seed/${Date.now()}/640/360`,
    });
    setPortfolio((prev) => [...prev, item]);
    setNewItem({ title: '', brand: 'Personal', metric: '', imageUrl: '' });
    setShowAddItem(false);
  }

  if (loading) return <div className="skeleton" style={{ height: 300 }} />;

  return (
    <div className="mediakit-page">
      <div>
        <h1>Media kit</h1>
        <p className="eyebrow">Your rate card and portfolio — share-ready for brand outreach</p>
      </div>

      <section className="mediakit-section glass">
        <div className="mediakit-section-head">
          <h2>Rate card</h2>
          {!editingRates ? (
            <button className="btn btn-ghost" onClick={() => setEditingRates(true)}>Edit rates</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setEditingRates(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={savingRates} onClick={saveRates}>{savingRates ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </div>

        <table className="rate-table">
          <thead>
            <tr><th>Platform</th><th>Format</th><th>Price (₹)</th><th>Notes</th>{editingRates && <th /> }</tr>
          </thead>
          <tbody>
            {rateCard.map((r) => (
              <tr key={r.id}>
                {editingRates ? (
                  <>
                    <td><input value={r.platform} onChange={(e) => updateRate(r.id, { platform: e.target.value })} /></td>
                    <td><input value={r.format} onChange={(e) => updateRate(r.id, { format: e.target.value })} /></td>
                    <td><input type="number" value={r.price} onChange={(e) => updateRate(r.id, { price: Number(e.target.value) })} /></td>
                    <td><input value={r.notes ?? ''} onChange={(e) => updateRate(r.id, { notes: e.target.value })} /></td>
                    <td><button className="btn btn-danger" onClick={() => removeRateRow(r.id)}>Remove</button></td>
                  </>
                ) : (
                  <>
                    <td>{r.platform}</td>
                    <td>{r.format}</td>
                    <td>₹{r.price.toLocaleString('en-IN')}</td>
                    <td className="rate-notes">{r.notes ?? '—'}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {editingRates && <button className="btn btn-ghost" onClick={addRateRow} style={{ marginTop: 12 }}>+ Add row</button>}
      </section>

      <section className="mediakit-section glass">
        <div className="mediakit-section-head">
          <h2>Portfolio</h2>
          <button className="btn btn-ghost" onClick={() => setShowAddItem((s) => !s)}>{showAddItem ? 'Cancel' : '+ Add work'}</button>
        </div>

        {showAddItem && (
          <form className="portfolio-form" onSubmit={onAddItem}>
            <input required placeholder="Title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
            <input placeholder="Brand (or Personal)" value={newItem.brand} onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })} />
            <input placeholder="Metric e.g. 500K views" value={newItem.metric} onChange={(e) => setNewItem({ ...newItem, metric: e.target.value })} />
            <button className="btn btn-primary">Add</button>
          </form>
        )}

        <div className="portfolio-grid">
          {portfolio.map((p) => (
            <div className="portfolio-item glass" key={p.id}>
              <img src={p.imageUrl} alt={p.title} />
              <div className="portfolio-item-text">
                <strong>{p.title}</strong>
                <span>{p.brand} · {p.metric}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
