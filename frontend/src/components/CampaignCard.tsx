import { useState } from 'react';
import Avatar from './Avatar';
import type { Campaign } from '../api/types';
import { applyToCampaign } from '../api/services';
import './CampaignCard.css';

function formatDeadline(value: string) {
  if (!value) return 'Flexible deadline';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function CampaignCard({ campaign, viewerRole, viewerId, onApplied }: { campaign: Campaign; viewerRole: 'creator' | 'brand'; viewerId: string; onApplied?: (campaign: Campaign) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alreadyApplied = campaign.applicants.some((applicant) => applicant.creatorId === viewerId);
  const closed = campaign.status !== 'open';

  async function apply() {
    if (busy || alreadyApplied || closed) return;
    setBusy(true);
    setError('');
    try {
      const updated = await applyToCampaign(campaign.id);
      onApplied?.(updated);
    } catch {
      setError('Application could not be submitted. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="campaign-card">
      <div className="campaign-card-topline"><span className={`campaign-status-pill ${closed ? 'is-closed' : 'is-open'}`}><i />{closed ? 'Closed' : 'Accepting applications'}</span><span className="campaign-platform-pill">{campaign.platform}</span></div>
      <div className="campaign-head">
        <Avatar src={campaign.brandLogo} name={campaign.brandName} size={46} />
        <div className="campaign-head-text"><h3>{campaign.title}</h3><span>{campaign.brandName}</span></div>
      </div>
      <p className="campaign-desc">{campaign.description}</p>
      <div className="campaign-niche-row"><span className="campaign-niche-chip">{campaign.niche}</span></div>
      <div className="campaign-meta">
        <div><span>Campaign budget</span><strong>{campaign.budget || 'Not specified'}</strong></div>
        <div><span>Deliverables</span><strong>{campaign.deliverables || 'To be discussed'}</strong></div>
        <div><span>Apply before</span><strong>{formatDeadline(campaign.deadline)}</strong></div>
        <div><span>Creator interest</span><strong>{campaign.applicants.length} applicant{campaign.applicants.length === 1 ? '' : 's'}</strong></div>
      </div>
      {viewerRole === 'creator' ? <div className="campaign-card-action"><button className={`campaign-apply-btn ${alreadyApplied ? 'is-applied' : ''}`} disabled={busy || alreadyApplied || closed} onClick={apply}>{alreadyApplied ? '✓ Application submitted' : closed ? 'Applications closed' : busy ? 'Submitting…' : 'View opportunity & apply ↗'}</button>{error && <span className="campaign-card-error" role="alert">{error}</span>}</div> : <div className="campaign-applicants"><div className="campaign-applicants-heading"><strong>Creator applications</strong><span>{campaign.applicants.length} total</span></div>{campaign.applicants.length ? campaign.applicants.map((applicant) => <div className="applicant-row" key={applicant.creatorId}><Avatar src={applicant.creatorAvatar} name={applicant.creatorName} size={29} /><span className="applicant-name">{applicant.creatorName}</span><span className={`applicant-status applicant-status-${applicant.status}`}>{applicant.status}</span></div>) : <p className="campaign-no-applicants">No applications yet. Share your campaign to reach creators.</p>}</div>}
    </article>
  );
}
