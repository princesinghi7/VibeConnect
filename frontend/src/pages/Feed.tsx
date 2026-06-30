import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { createPost, getFeed } from '../api/services';
import type { Post } from '../api/types';
import './Feed.css';

const TAG_OPTIONS = ['relatablecontent', 'lifestyle', 'tech', 'comedy', 'fitness', 'buildinpublic'];

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFeed().then((p) => { setPosts(p); setLoading(false); });
  }, []);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => { if (p.tag) counts.set(p.tag, (counts.get(p.tag) ?? 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [posts]);

  const shownPosts = activeFilter ? posts.filter((p) => p.tag === activeFilter) : posts;

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  async function submitPost() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const post = await createPost(draft.trim(), selectedTag, imagePreview ?? undefined);
      setPosts((prev) => [post, ...prev]);
      setDraft('');
      setSelectedTag(undefined);
      setImagePreview(null);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="feed-page">
      <div>
        <h1>Feed</h1>
        <p className="eyebrow">What the network is shipping today</p>
      </div>

      {trendingTags.length > 0 && (
        <div className="trending-row">
          <span className="eyebrow trending-label">Trending</span>
          <button className={`tag trending-chip${activeFilter === null ? ' active' : ''}`} onClick={() => setActiveFilter(null)}>All</button>
          {trendingTags.map(([tag, count]) => (
            <button
              key={tag}
              className={`tag trending-chip${activeFilter === tag ? ' active' : ''}`}
              onClick={() => setActiveFilter(tag === activeFilter ? null : tag)}
            >
              #{tag} · {count}
            </button>
          ))}
        </div>
      )}

      <div className="composer glass">
        <Avatar src={user?.avatarUrl ?? ''} name={user?.name ?? ''} size={44} />
        <div className="composer-body">
          <textarea
            rows={2}
            maxLength={280}
            placeholder="Share what you're building…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          {imagePreview && (
            <div className="composer-preview">
              <img src={imagePreview} alt="attachment preview" />
              <button className="composer-preview-remove" onClick={() => setImagePreview(null)} aria-label="Remove image">✕</button>
            </div>
          )}

          <div className="composer-tags">
            {TAG_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag composer-tag${selectedTag === t ? ' active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === t ? undefined : t)}
              >
                #{t}
              </button>
            ))}
          </div>

          <div className="composer-actions">
            <div className="composer-actions-left">
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPickImage} />
              <button type="button" className="btn btn-ghost composer-attach" onClick={() => fileInput.current?.click()}>
                📷 Add photo
              </button>
              <span className="eyebrow">{draft.length}/280</span>
            </div>
            <button className="btn btn-primary" onClick={submitPost} disabled={posting || !draft.trim()}>
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="feed-list">
          {[1, 2, 3].map((i) => <div className="skeleton" style={{ height: 160 }} key={i} />)}
        </div>
      ) : (
        <div className="feed-list">
          {shownPosts.map((p) => <PostCard post={p} key={p.id} />)}
          {shownPosts.length === 0 && <p className="eyebrow">No posts with this tag yet.</p>}
        </div>
      )}
    </div>
  );
}
