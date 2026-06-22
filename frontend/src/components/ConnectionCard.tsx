import { useState } from 'react';
import Avatar from './Avatar';
import type { Connection } from '../api/types';
import { setConnectionStatus } from '../api/services';
import './ConnectionCard.css';

export default function ConnectionCard({ connection }: { connection: Connection }) {
  const [status, setStatus] = useState(connection.status);
  const [busy, setBusy] = useState(false);

  async function act(next: Connection['status']) {
    setBusy(true);
    setStatus(next);
    try {
      await setConnectionStatus(connection.id, next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="conn-card glass">
      <Avatar src={connection.avatarUrl} name={connection.name} size={56} ring />
      <div className="conn-info">
        <strong>{connection.name}</strong>
        <span className="conn-handle">{connection.handle}</span>
        <span className="conn-role">{connection.role}</span>
        <div className="conn-skills">
          {connection.skills.map((s) => (
            <span className="tag" key={s}>{s}</span>
          ))}
        </div>
        <span className="conn-mutual">{connection.mutuals} mutual connections</span>
      </div>

      <div className="conn-actions">
        {status === 'connected' && <button className="btn btn-ghost" disabled>Connected</button>}
        {status === 'pending' && <button className="btn btn-ghost" disabled={busy}>Pending</button>}
        {status === 'suggested' && (
          <button className="btn btn-primary" disabled={busy} onClick={() => act('pending')}>
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
