import { useState } from 'react';
import Avatar from './Avatar';
import type { Connection } from '../api/types';
import { setConnectionStatus } from '../api/services';
import './ConnectionCard.css';

export default function ConnectionCard({
  connection, onStatusChange,
}: {
  connection: Connection;
  onStatusChange?: (id: string, status: Connection['status']) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nextStatus: Connection['status'] = connection.status === 'suggested' ? 'pending' : 'suggested';

  async function act() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await setConnectionStatus(connection.id, nextStatus);
      onStatusChange?.(connection.id, nextStatus);
    } catch {
      setError('Could not update this connection. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const actionLabel = connection.status === 'connected'
    ? 'Disconnect'
    : connection.status === 'pending' ? 'Cancel request' : 'Connect';

  return (
    <article className="conn-card">
      <div className="conn-card-top">
        <div className="conn-avatar-wrap"><Avatar src={connection.avatarUrl} name={connection.name} size={58} ring /></div>
        <span className={`conn-status conn-status-${connection.status}`}><i />{connection.status === 'connected' ? 'Connected' : connection.status === 'pending' ? 'Request sent' : 'Suggested'}</span>
      </div>
      <div className="conn-info">
        <strong className="conn-name">{connection.name}</strong>
        <span className="conn-handle">{connection.handle}</span>
        <span className="conn-role">{connection.role}</span>
        {connection.skills.length > 0 && <div className="conn-skills">{connection.skills.slice(0, 3).map((skill) => <span className="conn-skill" key={skill}>{skill}</span>)}{connection.skills.length > 3 && <span className="conn-skill conn-skill-more">+{connection.skills.length - 3}</span>}</div>}
      </div>
      <div className="conn-card-footer">
        <span className="conn-mutual"><span aria-hidden="true">♧</span>{connection.mutuals} mutual connections</span>
        <button type="button" className={`conn-action ${connection.status === 'suggested' ? 'conn-action-primary' : 'conn-action-secondary'}`} disabled={busy} onClick={() => void act()}>
          {busy ? 'Updating…' : actionLabel}
          {connection.status === 'suggested' && !busy && <span aria-hidden="true">＋</span>}
        </button>
      </div>
      {error && <p className="conn-action-error" role="alert">{error}</p>}
    </article>
  );
}
