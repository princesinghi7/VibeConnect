import { useEffect, useMemo, useState } from 'react';
import ConnectionCard from '../components/ConnectionCard';
import { getConnections } from '../api/services';
import type { Connection } from '../api/types';
import './Connections.css';

type FilterKey = Connection['status'] | 'all';
const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All network' },
  { key: 'connected', label: 'Connected' },
  { key: 'pending', label: 'Pending' },
  { key: 'suggested', label: 'Discover' },
];

export default function Connections() {
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  async function loadConnections() {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await getConnections());
    } catch {
      setLoadError('We could not load your network. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadConnections(); }, []);

  function handleStatusChange(id: string, status: Connection['status']) {
    setItems((current) => current.map((connection) =>
      connection.id === id ? { ...connection, status } : connection,
    ));
  }

  const counts = useMemo(() => ({
    all: items.length,
    connected: items.filter((item) => item.status === 'connected').length,
    pending: items.filter((item) => item.status === 'pending').length,
    suggested: items.filter((item) => item.status === 'suggested').length,
  }), [items]);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => filter === 'all' || item.status === filter)
      .filter((item) => !query || [item.name, item.handle, item.role, ...item.skills].join(' ').toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, filter, search]);

  return (
    <main className="connections-page">
      <section className="connections-hero">
        <div className="connections-heading">
          <span className="connections-kicker">YOUR PROFESSIONAL NETWORK</span>
          <h1>Connections</h1>
          <p>Build meaningful relationships with creators and brands. Your next collaboration can start here.</p>
        </div>
        <div className="connections-hero-note">
          <span className="connections-spark" aria-hidden="true">✦</span>
          <div><strong>Grow together</strong><span>Connect. Collaborate. Create.</span></div>
        </div>
      </section>

      <section className="connections-stats" aria-label="Network overview">
        <article className="connection-stat"><span className="connection-stat-icon">◎</span><div><strong>{loading ? '—' : counts.all}</strong><span>Total profiles</span></div></article>
        <article className="connection-stat"><span className="connection-stat-icon">↗</span><div><strong>{loading ? '—' : counts.connected}</strong><span>Connected</span></div></article>
        <article className="connection-stat"><span className="connection-stat-icon">◷</span><div><strong>{loading ? '—' : counts.pending}</strong><span>Pending requests</span></div></article>
        <article className="connection-stat"><span className="connection-stat-icon">✧</span><div><strong>{loading ? '—' : counts.suggested}</strong><span>People to discover</span></div></article>
      </section>

      <section className="connections-toolbar">
        <div className="connections-toolbar-copy"><h2>Your network</h2><p>Manage your relationships in one place.</p></div>
        <label className="connections-search">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, role or skill..." aria-label="Search connections" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
        </label>
      </section>

      <nav className="connections-tabs" aria-label="Filter connections">
        {filters.map((item) => (
          <button key={item.key} type="button" className={`connections-tab ${filter === item.key ? 'is-active' : ''}`} onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}>
            {item.label}<span>{loading ? '—' : counts[item.key]}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="connections-grid" aria-label="Loading connections">
          {[1, 2, 3, 4].map((number) => <div className="connection-skeleton" key={number}><div className="skeleton-avatar"/><div className="skeleton-lines"><i/><i/><i/></div></div>)}
        </div>
      ) : loadError ? (
        <div className="connections-empty"><span className="connections-empty-icon">!</span><h3>Something went wrong</h3><p>{loadError}</p><button className="connections-primary-btn" onClick={() => void loadConnections()}>Try again</button></div>
      ) : shown.length ? (
        <div className="connections-grid">
          {shown.map((connection) => <ConnectionCard key={connection.id} connection={connection} onStatusChange={handleStatusChange} />)}
        </div>
      ) : (
        <div className="connections-empty">
          <span className="connections-empty-icon">⌕</span>
          <h3>{search ? 'No matching profiles' : filter === 'all' ? 'Your network is waiting' : `No ${filter === 'suggested' ? 'new suggestions' : filter + ' connections'} yet`}</h3>
          <p>{search ? 'Try another name, role or skill.' : 'Explore profiles and start building your professional network.'}</p>
          {search && <button className="connections-secondary-btn" onClick={() => setSearch('')}>Clear search</button>}
        </div>
      )}
    </main>
  );
}
