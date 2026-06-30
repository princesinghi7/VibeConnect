import { useEffect, useState } from 'react';
import ConnectionCard from '../components/ConnectionCard';
import { getConnections } from '../api/services';
import type { Connection } from '../api/types';
import './Connections.css';

const filters: { key: Connection['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'connected', label: 'Connected' },
  { key: 'pending', label: 'Pending' },
  { key: 'suggested', label: 'Suggested' },
];

export default function Connections() {
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Connection['status'] | 'all'>('all');

  useEffect(() => {
    getConnections().then((c) => { setItems(c); setLoading(false); });
  }, []);

  function handleStatusChange(id: string, status: Connection['status']) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  const shown = filter === 'all' ? items : items.filter((c) => c.status === filter);

  return (
    <div className="connections-page">
      <div>
        <h1>Connections</h1>
        <p className="eyebrow">Your network of creators and brands</p>
      </div>

      <div className="conn-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="conn-grid">
          {[1, 2, 3, 4].map((i) => <div className="skeleton" style={{ height: 150 }} key={i} />)}
        </div>
      ) : (
        <div className="conn-grid">
          {shown.map((c) => <ConnectionCard connection={c} key={c.id} onStatusChange={handleStatusChange} />)}
          {shown.length === 0 && <p className="eyebrow">No connections in this filter yet.</p>}
        </div>
      )}
    </div>
  );
}
