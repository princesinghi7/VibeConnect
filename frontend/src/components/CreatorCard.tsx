import Avatar from './Avatar';
import type { CreatorCard as CreatorCardType } from '../api/types';
import './DiscoveryCard.css';

function formatFollowers(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

export default function CreatorCard({ creator, onInvite }: { creator: CreatorCardType; onInvite?: () => void }) {
  return (
    <div className="discovery-card glass">
      <div className="discovery-head">
        <Avatar src={creator.avatarUrl} name={creator.name} size={56} ring />
        <div className="discovery-info">
          <strong>{creator.name}</strong>
          <span className="discovery-handle">{creator.handle}</span>
        </div>
        <span className="tag">{creator.niche}</span>
      </div>

      <p className="discovery-bio">{creator.bio}</p>

      <div className="discovery-stats">
        <div><strong>{formatFollowers(creator.followers)}</strong><span>Followers</span></div>
        <div><strong>{creator.engagementRate}%</strong><span>Engagement</span></div>
        <div><strong>{creator.location.split(',')[0]}</strong><span>Location</span></div>
      </div>

      <div className="discovery-socials">
        {creator.socials.instagram && <a href={creator.socials.instagram} target="_blank" rel="noreferrer" className="tag">Instagram</a>}
        {creator.socials.youtube && <a href={creator.socials.youtube} target="_blank" rel="noreferrer" className="tag">YouTube</a>}
        {creator.socials.facebook && <a href={creator.socials.facebook} target="_blank" rel="noreferrer" className="tag">Facebook</a>}
      </div>

      {onInvite && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onInvite}>
          Invite to campaign
        </button>
      )}
    </div>
  );
}
