import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { createPost, getFeed } from '../api/services';
import type { Post } from '../api/types';
import './Feed.css';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getFeed().then((p) => { setPosts(p); setLoading(false); });
  }, []);

  async function submitPost() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const post = await createPost(draft.trim());
      setPosts((prev) => [post, ...prev]);
      setDraft('');
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

      <div className="composer glass">
        <Avatar src={user?.avatarUrl ?? ''} name={user?.name ?? ''} size={44} />
        <div className="composer-body">
          <textarea
            rows={2}
            placeholder="Share what you're building…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="composer-actions">
            <span className="eyebrow">{draft.length}/280</span>
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
          {posts.map((p) => <PostCard post={p} key={p.id} />)}
        </div>
      )}
    </div>
  );
}
