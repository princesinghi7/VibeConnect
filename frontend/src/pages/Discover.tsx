import { useEffect, useMemo, useState } from 'react';
import CreatorCard from '../components/CreatorCard';
import BrandCard from '../components/BrandCard';
import { useAuth } from '../hooks/useAuth';
import { getCreators, getBrands } from '../api/services';
import type { CreatorCard as CreatorCardType, BrandCard as BrandCardType } from '../api/types';
import './Discover.css';

const NICHES = ['all', 'Relatable Content', 'Lifestyle', 'Tech', 'Comedy', 'Fitness'];
const SAVED_BRANDS_KEY = 'vc_saved_brands_v1';

type BrandSort = 'recommended' | 'name' | 'budget-high' | 'budget-low';

function readSavedBrands(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SAVED_BRANDS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function budgetValue(value: string): number {
  const amounts = value.match(/[\d,]+/g)?.map((part) => Number(part.replace(/,/g, ''))).filter(Number.isFinite) ?? [];
  return amounts.length ? amounts[amounts.length - 1] : 0;
}

export default function Discover() {
  const { user } = useAuth();
  const isBrand = user?.accountType === 'brand';

  const [creators, setCreators] = useState<CreatorCardType[]>([]);
  const [brands, setBrands] = useState<BrandCardType[]>([]);
  const [niche, setNiche] = useState('all');
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [brandNiche, setBrandNiche] = useState('all');
  const [sort, setSort] = useState<BrandSort>('recommended');
  const [savedBrands, setSavedBrands] = useState<string[]>(readSavedBrands);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const request = isBrand ? getCreators(niche) : getBrands();
    request.then((result) => {
      if (!active) return;
      if (isBrand) setCreators(result as CreatorCardType[]);
      else setBrands(result as BrandCardType[]);
    }).catch(() => {
      if (active) setError('We could not load discovery results. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [isBrand, niche, reloadKey]);

  function toggleSaved(brandId: string) {
    setSavedBrands((current) => {
      const next = current.includes(brandId)
        ? current.filter((id) => id !== brandId)
        : [...current, brandId];
      try { localStorage.setItem(SAVED_BRANDS_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
      return next;
    });
  }

  const industries = useMemo(
    () => [...new Set(brands.map((brand) => brand.industry).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [brands],
  );

  const availableNiches = useMemo(
    () => [...new Set(brands.flatMap((brand) => brand.targetNiches))].sort((a, b) => a.localeCompare(b)),
    [brands],
  );

  const filteredBrands = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = brands.filter((brand) => {
      const matchesSearch = !term || [brand.companyName, brand.industry, brand.bio, brand.budgetRange, ...brand.targetNiches]
        .some((value) => value.toLowerCase().includes(term));
      const matchesIndustry = industry === 'all' || brand.industry === industry;
      const matchesNiche = brandNiche === 'all' || brand.targetNiches.includes(brandNiche);
      const matchesSaved = !showSavedOnly || savedBrands.includes(brand.id);
      return matchesSearch && matchesIndustry && matchesNiche && matchesSaved;
    });

    if (sort === 'name') result.sort((a, b) => a.companyName.localeCompare(b.companyName));
    if (sort === 'budget-high') result.sort((a, b) => budgetValue(b.budgetRange) - budgetValue(a.budgetRange));
    if (sort === 'budget-low') result.sort((a, b) => budgetValue(a.budgetRange) - budgetValue(b.budgetRange));
    return result;
  }, [brands, search, industry, brandNiche, showSavedOnly, savedBrands, sort]);

  const hasActiveFilters = Boolean(search || industry !== 'all' || brandNiche !== 'all' || showSavedOnly);

  function clearFilters() {
    setSearch('');
    setIndustry('all');
    setBrandNiche('all');
    setShowSavedOnly(false);
    setSort('recommended');
  }

  return (
    <div className="discover-page">
      <section className="discover-hero">
        <div className="discover-hero-copy">
          <span className="discover-kicker"><span className="discover-kicker-dot" /> VIBECONNECT NETWORK</span>
          <h1>{isBrand ? 'Find your next creator.' : 'Find brands worth creating for.'}</h1>
          <p>{isBrand
            ? 'Discover creators who understand your audience, match your niche and bring your next campaign to life.'
            : 'Explore brands, discover collaboration opportunities and find partners that align with your content.'}</p>
        </div>
        <div className="discover-hero-art" aria-hidden="true">
          <span className="discover-orbit discover-orbit-one" />
          <span className="discover-orbit discover-orbit-two" />
          <span className="discover-orbit-core">✳</span>
          <span className="discover-orbit-label">CREATE<br />TOGETHER</span>
        </div>
      </section>

      {isBrand ? (
        <>
          <div className="discover-section-heading">
            <div><span className="discover-section-kicker">TALENT DISCOVERY</span><h2>Explore creators</h2></div>
            <span className="discover-result-count">{creators.length} creators</span>
          </div>
          <div className="discover-filters" aria-label="Filter creators by niche">
            {NICHES.map((item) => (
              <button type="button" key={item} className={`discover-chip ${niche === item ? 'active' : ''}`} onClick={() => setNiche(item)}>
                {item === 'all' ? 'All niches' : item}
              </button>
            ))}
          </div>
          {loading ? <div className="discover-grid">{[1, 2, 3, 4].map((i) => <div className="discover-skeleton" key={i} />)}</div>
            : error ? <div className="discover-empty"><h3>Something went wrong</h3><p>{error}</p><button className="discover-reset-btn" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>
              : <div className="discover-grid">{creators.map((creator) => <CreatorCard creator={creator} key={creator.id} />)}{creators.length === 0 && <div className="discover-empty"><h3>No creators found</h3><p>Try another niche to see more talent.</p></div>}</div>}
        </>
      ) : (
        <>
          <section className="discover-brand-toolbar">
            <div className="discover-search-wrap">
              <span className="discover-search-icon" aria-hidden="true">⌕</span>
              <input aria-label="Search brands" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brands, industries or niches..." />
              {search && <button type="button" className="discover-clear-search" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
            </div>
            <label className="discover-sort-control"><span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as BrandSort)}>
                <option value="recommended">Recommended</option><option value="name">Brand name</option><option value="budget-high">Highest budget</option><option value="budget-low">Lowest budget</option>
              </select>
            </label>
          </section>

          <section className="discover-filter-panel" aria-label="Brand filters">
            <div className="discover-filter-group">
              <label htmlFor="discover-industry">Industry</label>
              <select id="discover-industry" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                <option value="all">All industries</option>
                {industries.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </div>
            <div className="discover-filter-group">
              <label htmlFor="discover-niche">Creator niche</label>
              <select id="discover-niche" value={brandNiche} onChange={(event) => setBrandNiche(event.target.value)}>
                <option value="all">All creator niches</option>
                {availableNiches.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </div>
            <button type="button" className={`discover-saved-filter ${showSavedOnly ? 'active' : ''}`} onClick={() => setShowSavedOnly((value) => !value)}>
              <span aria-hidden="true">♡</span> Saved brands <b>{savedBrands.length}</b>
            </button>
            {hasActiveFilters && <button type="button" className="discover-reset-btn" onClick={clearFilters}>Clear filters</button>}
          </section>

          <div className="discover-section-heading discover-brand-heading">
            <div><span className="discover-section-kicker">YOUR NEXT COLLAB STARTS HERE</span><h2>Brands to explore</h2></div>
            <span className="discover-result-count">{loading ? 'Loading…' : `${filteredBrands.length} ${filteredBrands.length === 1 ? 'brand' : 'brands'} found`}</span>
          </div>

          {loading ? <div className="discover-grid">{[1, 2, 3, 4].map((i) => <div className="discover-skeleton" key={i} />)}</div>
            : error ? <div className="discover-empty"><h3>We couldn't load brands</h3><p>{error}</p><button className="discover-reset-btn" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>
              : filteredBrands.length > 0 ? <div className="discover-grid">{filteredBrands.map((brand) => <BrandCard key={brand.id} brand={brand} isSaved={savedBrands.includes(brand.id)} onSave={() => toggleSaved(brand.id)} />)}</div>
                : <div className="discover-empty"><span className="discover-empty-icon">⌕</span><h3>{showSavedOnly ? 'No saved brands yet' : 'No matching brands found'}</h3><p>{showSavedOnly ? 'Save brands you like and they will appear here.' : 'Try changing your search or removing a filter to discover more brands.'}</p><button type="button" className="discover-reset-btn" onClick={clearFilters}>Show all brands</button></div>}

          <p className="discover-footnote">Brand information is provided for discovery. Campaign availability, budgets and partnership terms should be confirmed directly with each brand.</p>
        </>
      )}
    </div>
  );
}
