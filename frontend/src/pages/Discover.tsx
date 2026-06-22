import { useEffect, useState } from 'react';
import CreatorCard from '../components/CreatorCard';
import BrandCard from '../components/BrandCard';
import { useAuth } from '../hooks/useAuth';
import { getCreators, getBrands } from '../api/services';
import type { CreatorCard as CreatorCardType, BrandCard as BrandCardType } from '../api/types';
import './Discover.css';

const NICHES = ['all', 'Relatable Content', 'Lifestyle', 'Tech', 'Comedy', 'Fitness'];

export default function Discover() {
  const { user } = useAuth();
  const isBrand = user?.accountType === 'brand';

  const [creators, setCreators] = useState<CreatorCardType[]>([]);
  const [brands, setBrands] = useState<BrandCardType[]>([]);
  const [niche, setNiche] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (isBrand) {
      getCreators(niche).then((c) => { setCreators(c); setLoading(false); });
    } else {
      getBrands().then((b) => { setBrands(b); setLoading(false); });
    }
  }, [isBrand, niche]);

  return (
    <div className="discover-page">
      <div>
        <h1>{isBrand ? 'Discover creators' : 'Discover brands'}</h1>
        <p className="eyebrow">{isBrand ? 'Find creators who match your niche and budget' : 'Brands actively looking for creators like you'}</p>
      </div>

      {isBrand && (
        <div className="discover-filters">
          {NICHES.map((n) => (
            <button key={n} className={`btn ${niche === n ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setNiche(n)}>
              {n === 'all' ? 'All niches' : n}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="discover-grid">
          {[1, 2, 3, 4].map((i) => <div className="skeleton" style={{ height: 220 }} key={i} />)}
        </div>
      ) : isBrand ? (
        <div className="discover-grid">
          {creators.map((c) => <CreatorCard creator={c} key={c.id} />)}
          {creators.length === 0 && <p className="eyebrow">No creators match this niche yet.</p>}
        </div>
      ) : (
        <div className="discover-grid">
          {brands.map((b) => <BrandCard brand={b} key={b.id} />)}
        </div>
      )}
    </div>
  );
}
