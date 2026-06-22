import { useState } from 'react';
import Avatar from './Avatar';
import type { Campaign } from '../api/types';
import { applyToCampaign } from '../api/services';
import './CampaignCard.css';

export default function CampaignCard({
  campaign, viewerRole, viewerId, onApplied,
}: {
  campaign: Campaign;
  viewerRole: 'creator' | 'brand';
  viewerId: string;
  onApplied?: (c: Campaign) => void;
}) {
  const [busy, setBusy] = useState(false);
  const alreadyApplied = campaign.applicants.some((a) => a.creatorId === viewerId);

  async function apply() {
    setBusy(true);
    try {
      const updated = await applyToCampaign(campaign.id);
      onApplied?.(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="campaign-card glass">
      <div className="campaign-head">
        <Avatar src={campaign.brandLogo} name={campaign.brandName} size={44} />
        <div className="campaign-head-text">
          <strong>{campaign.title}</strong>
          <span>{campaign.brandName} · {campaign.platform}</span>
        </div>
        <span className={`tag campaign-status-${campaign.status}`}>{campaign.status}</span>
      </div>

      <p className="campaign-desc">{campaign.description}</p>

      <div className="campaign-meta">
        <div><span className="eyebrow">Niche</span><strong>{campaign.niche}</strong></div>
        <div><span className="eyebrow">Budget</span><strong>{campaign.budget}</strong></div>
        <div><span className="eyebrow">Deliverables</span><strong>{campaign.deliverables}</strong></div>
        <div><span className="eyebrow">Deadline</span><strong>{campaign.deadline}</strong></div>
      </div>

      {viewerRole === 'creator' && (
        <button className="btn btn-primary" disabled={busy || alreadyApplied} onClick={apply}>
          {alreadyApplied ? 'Applied' : busy ? 'Applying…' : 'Apply to campaign'}
        </button>
      )}

      {viewerRole === 'brand' && (
        <div className="campaign-applicants">
          <span className="eyebrow">{campaign.applicants.length} applicant{campaign.applicants.length === 1 ? '' : 's'}</span>
          {campaign.applicants.map((a) => (
            <div className="applicant-row" key={a.creatorId}>
              <Avatar src={a.creatorAvatar} name={a.creatorName} size={28} />
              <span>{a.creatorName}</span>
              <span className={`tag applicant-status-${a.status}`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
