import Avatar from './Avatar';
import type { BrandCard as BrandCardType } from '../api/types';
import './DiscoveryCard.css';

function domainFromUrl(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function BrandCard({ brand }: { brand: BrandCardType }) {
  const domain = domainFromUrl(brand.website);

  function openSite() {
    if (brand.website) window.open(brand.website, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className="brand-card glass"
      role={brand.website ? 'link' : undefined}
      tabIndex={brand.website ? 0 : undefined}
      onClick={openSite}
      onKeyDown={(e) => { if (e.key === 'Enter') openSite(); }}
    >
      <div className="brand-card-banner" />

      <div className="brand-card-body">
        <div className="discovery-head">
          <Avatar src={brand.avatarUrl} name={brand.companyName} size={56} ring />
          <div className="discovery-info">
            <strong className="brand-name-row">
              {brand.companyName}
              <span className="verified-badge" title="Verified brand">✓</span>
            </strong>
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
          <button
            className="btn btn-ghost brand-visit-btn"
            onClick={(e) => { e.stopPropagation(); openSite(); }}
          >
            Visit {domain ?? 'website'} ↗
          </button>
        )}
      </div>
    </div>
  );
}
