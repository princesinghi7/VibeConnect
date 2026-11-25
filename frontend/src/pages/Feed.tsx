import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { createPost, getFeed } from '../api/services';
import type { Post } from '../api/types';
import './Feed.css';

const TAG_OPTIONS = ['relatablecontent', 'lifestyle', 'tech', 'comedy', 'fitness', 'buildinpublic'];

type FeedFilter = 'all' | 'media' | 'text';
type FeedSort = 'latest' | 'popular';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [sortBy, setSortBy] = useState<FeedSort>('latest');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    getFeed()
      .then((items) => { if (mounted) setPosts(items); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      if (post.tag) counts.set(post.tag, (counts.get(post.tag) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const matchesTag = !activeTag || post.tag === activeTag;
      const matchesType = feedFilter === 'all'
        || (feedFilter === 'media' && Boolean(post.imageUrl))
        || (feedFilter === 'text' && !post.imageUrl);
      const matchesSearch = !query
        || `${post.content} ${post.author.name} ${post.author.handle} ${post.tag ?? ''}`.toLowerCase().includes(query);
      return matchesTag && matchesType && matchesSearch;
    });

    return [...filtered].sort((a, b) => sortBy === 'popular'
      ? b.likes - a.likes
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, activeTag, feedFilter, search, sortBy]);

  function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice('Please choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    setNotice('');
    setImagePreview(URL.createObjectURL(file));
    event.target.value = '';
  }

  async function submitPost() {
    if (!draft.trim() || posting) return;
    setPosting(true);
    setNotice('');
    try {
      const post = await createPost(draft.trim(), selectedTag, imagePreview ?? undefined);
      setPosts((current) => [post, ...current]);
      setDraft('');
      setSelectedTag(undefined);
      setImagePreview(null);
      setActiveTag(null);
      setFeedFilter('all');
      setSortBy('latest');
      setNotice('Your update has been published.');
    } catch {
      setNotice('Could not publish your update. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);

  return (
    <div className="feed-page">
      <header className="feed-header">
        <div>
          <span className="feed-eyebrow">VIBECONNECT COMMUNITY</span>
          <h1>Your creator network, <span>in motion.</span></h1>
          <p>Ideas, milestones and conversations from the people building what’s next.</p>
        </div>
        <div className="feed-header-mark" aria-hidden="true">✳</div>
      </header>

      <section className="feed-insight-strip" aria-label="Community overview">
        <div className="feed-insight">
          <span className="feed-insight-icon">◉</span>
          <div><strong>{posts.length}</strong><span>Community updates</span></div>
        </div>
        <div className="feed-insight">
          <span className="feed-insight-icon">♡</span>
          <div><strong>{totalLikes.toLocaleString('en-IN')}</strong><span>Reactions shared</span></div>
        </div>
        <div className="feed-insight">
          <span className="feed-insight-icon">#</span>
          <div><strong>{trendingTags.length}</strong><span>Trending topics</span></div>
        </div>
      </section>

      <div className="feed-layout">
        <main className="feed-main">
          <section className="feed-composer">
            <div className="feed-composer-heading">
              <Avatar src={user?.avatarUrl ?? ''} name={user?.name ?? 'You'} size={46} />
              <div>
                <strong>Start a conversation</strong>
                <span>Share a win, ask a question or show what you’re creating.</span>
              </div>
            </div>

            <textarea
              className="feed-composer-input"
              rows={3}
              maxLength={280}
              placeholder="What’s happening in your creator journey?"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Write a community post"
            />

            {imagePreview && (
              <div className="feed-image-preview">
                <img src={imagePreview} alt="Selected post attachment preview" />
                <button type="button" onClick={() => setImagePreview(null)} aria-label="Remove selected image">×</button>
              </div>
            )}

            <div className="feed-composer-bottom">
              <div className="feed-composer-tools">
                <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPickImage} />
                <button type="button" className="feed-tool-button" onClick={() => fileInput.current?.click()}>
                  <span>▧</span> Add photo
                </button>
                <div className="feed-tag-picker">
                  <label htmlFor="feed-tag">Topic</label>
                  <select id="feed-tag" value={selectedTag ?? ''} onChange={(event) => setSelectedTag(event.target.value || undefined)}>
                    <option value="">Choose a topic</option>
                    {TAG_OPTIONS.map((tag) => <option value={tag} key={tag}>#{tag}</option>)}
                  </select>
                </div>
              </div>
              <div className="feed-publish-area">
                <span className={draft.length > 260 ? 'feed-char-count near-limit' : 'feed-char-count'}>{draft.length}/280</span>
                <button type="button" className="feed-publish-button" onClick={submitPost} disabled={posting || !draft.trim()}>
                  {posting ? 'Publishing…' : 'Publish update'} <span>↗</span>
                </button>
              </div>
            </div>
            {notice && <p className="feed-notice" role="status">{notice}</p>}
          </section>

          <section className="feed-stream">
            <div className="feed-stream-heading">
              <div>
                <span className="feed-eyebrow">THE COMMUNITY</span>
                <h2>Latest conversations</h2>
              </div>
              <label className="feed-sort-control">
                <span>Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as FeedSort)}>
                  <option value="latest">Latest</option>
                  <option value="popular">Most liked</option>
                </select>
              </label>
            </div>

            <div className="feed-filter-bar">
              <div className="feed-filter-tabs" role="group" aria-label="Filter posts by type">
                {([
                  ['all', 'All posts'],
                  ['media', 'With media'],
                  ['text', 'Text only'],
                ] as [FeedFilter, string][]).map(([value, label]) => (
                  <button key={value} type="button" className={feedFilter === value ? 'active' : ''} onClick={() => setFeedFilter(value)}>{label}</button>
                ))}
              </div>
              <label className="feed-search">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search updates…" aria-label="Search updates" />
              </label>
            </div>

            {trendingTags.length > 0 && (
              <div className="feed-topic-row">
                <span>Explore topics</span>
                <button type="button" className={!activeTag ? 'active' : ''} onClick={() => setActiveTag(null)}>All topics</button>
                {trendingTags.map(([tag, count]) => (
                  <button type="button" key={tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(activeTag === tag ? null : tag)}>
                    #{tag} <small>{count}</small>
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="feed-loading-list">
                {[1, 2, 3].map((item) => <div className="feed-loading-card" key={item} />)}
              </div>
            ) : visiblePosts.length > 0 ? (
              <div className="feed-list">
                {visiblePosts.map((post) => <PostCard post={post} key={post.id} />)}
              </div>
            ) : (
              <div className="feed-empty-state">
                <span>✳</span>
                <h3>No updates found</h3>
                <p>Try another search or filter, or be the first to start this conversation.</p>
                <button type="button" onClick={() => { setSearch(''); setActiveTag(null); setFeedFilter('all'); }}>Clear filters</button>
              </div>
            )}
          </section>
        </main>

        <aside className="feed-sidebar">
          <section className="feed-side-card feed-guidelines">
            <span className="feed-side-icon">✦</span>
            <span className="feed-eyebrow">A GOOD PLACE TO GROW</span>
            <h3>Make every post count.</h3>
            <p>Share what you’re learning, celebrate progress and give other creators something useful to take away.</p>
            <div className="feed-guideline-item"><span>01</span> Share real progress</div>
            <div className="feed-guideline-item"><span>02</span> Keep feedback constructive</div>
            <div className="feed-guideline-item"><span>03</span> Credit the people you work with</div>
          </section>

          <section className="feed-side-card">
            <div className="feed-side-heading"><div><span className="feed-eyebrow">DISCOVER</span><h3>Trending topics</h3></div><span>↗</span></div>
            {trendingTags.length ? trendingTags.slice(0, 5).map(([tag, count], index) => (
              <button type="button" className="feed-trending-item" key={tag} onClick={() => { setActiveTag(tag); setFeedFilter('all'); }}>
                <span className="feed-trending-rank">0{index + 1}</span>
                <span className="feed-trending-name">#{tag}</span>
                <span className="feed-trending-count">{count} posts</span>
              </button>
            )) : <p className="feed-side-muted">Topics will appear as the community starts posting.</p>}
          </section>

          <div className="feed-side-footer">
            <span>VibeConnect</span>
            <span>Built for meaningful connections.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
