import Avatar from './Avatar';
import type { BrandCard as BrandCardType } from '../api/types';
import './DiscoveryCard.css';

export default function BrandCard({ brand }: { brand: BrandCardType }) {
  return (
    <div className="discovery-card glass">
      <div className="discovery-head">
        <Avatar src={brand.avatarUrl} name={brand.companyName} size={56} ring />
        <div className="discovery-info">
          <strong>{brand.companyName}</strong>
          <span className="discovery-handle">{brand.industry}</span>
        </div>
      </div>

      <p className="discovery-bio">{brand.bio}</p>

      <div className="discovery-niches">
        {brand.targetNiches.map((n) => <span className="tag" key={n}>{n}</span>)}
      </div>

      <div className="discovery-budget">
        <span className="eyebrow">Typical budget</span>
        <strong>{brand.budgetRange}</strong>
      </div>

      {brand.website && (
        <a href={brand.website} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ width: '100%' }}>
          Visit website
        </a>
      )}
    </div>
  );
}
