import Avatar from './Avatar';
import type { BrandCard as BrandCardType } from '../api/types';

function domainFromUrl(url?: string) {
  if (!url) return null;
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.hostname.replace(/^www\./, '') : null; } catch { return null; }
}

export default function BrandCard({
  brand,
  isSaved = false,
  onSave,
}: {
  brand: BrandCardType;
  isSaved?: boolean;
  onSave?: () => void;
}) {
  const domain = domainFromUrl(brand.website);
  const safeWebsite = domain ? brand.website : undefined;

  return (
    <article className="discover-brand-card">
      <div className="discover-brand-cover">
        <span className="discover-brand-cover-glow" />
        <span className="discover-brand-industry">{brand.industry || 'Brand partner'}</span>
        {onSave && <button type="button" className={`discover-brand-save ${isSaved ? 'saved' : ''}`} onClick={onSave} aria-label={isSaved ? `Remove ${brand.companyName} from saved brands` : `Save ${brand.companyName}`} aria-pressed={isSaved}><span>{isSaved ? '♥' : '♡'}</span></button>}
      </div>
      <div className="discover-brand-content">
        <div className="discover-brand-identity">
          <Avatar src={brand.avatarUrl} name={brand.companyName} size={58} ring />
          <div className="discover-brand-title"><h3>{brand.companyName}</h3><span>{domain ?? 'Explore brand profile'}</span></div>
          <span className="discover-brand-mark" title="Brand listing">✦</span>
        </div>
        <p className="discover-brand-bio">{brand.bio}</p>
        <div className="discover-brand-tags" aria-label="Target creator niches">
          {brand.targetNiches.slice(0, 3).map((niche) => <span key={niche}>{niche}</span>)}
          {brand.targetNiches.length > 3 && <span>+{brand.targetNiches.length - 3}</span>}
        </div>
        <div className="discover-brand-budget"><span>Typical campaign budget</span><strong>{brand.budgetRange || 'Contact brand for details'}</strong></div>
        <div className="discover-brand-actions">
          {safeWebsite ? <a className="discover-brand-visit" href={safeWebsite} target="_blank" rel="noopener noreferrer">Visit official website <span aria-hidden="true">↗</span></a> : <span className="discover-brand-no-site">Website not provided</span>}
        </div>
      </div>
    </article>
  );
}
