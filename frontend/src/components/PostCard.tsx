import { useState } from 'react';
import Avatar from './Avatar';
import type { Post } from '../api/types';
import { toggleLike } from '../api/services';
import './PostCard.css';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      await toggleLike(post.id, next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="post-card glass">
      <header className="post-head">
        <Avatar src={post.author.avatarUrl} name={post.author.name} size={44} />
        <div className="post-author">
          <strong>{post.author.name}</strong>
          <span>{post.author.role} · {timeAgo(post.createdAt)} ago</span>
        </div>
        {post.tag && <span className="tag">#{post.tag}</span>}
      </header>

      <p className="post-content">{post.content}</p>

      {post.imageUrl && (
        <div className="post-media">
          <img src={post.imageUrl} alt="" loading="lazy" />
        </div>
      )}

      <footer className="post-actions">
        <button className={`post-action${liked ? ' liked' : ''}`} onClick={handleLike}>
          <span>{liked ? '♥' : '♡'}</span> {likes}
        </button>
        <button className="post-action" onClick={() => setShowComments((s) => !s)}>
          <span>💬</span> {post.comments.length}
        </button>
        <button className="post-action">
          <span>↗</span> Share
        </button>
      </footer>

      {showComments && (
        <div className="post-comments">
          {post.comments.length === 0 && <p className="empty-comments">No comments yet — start the thread.</p>}
          {post.comments.map((c) => (
            <div className="comment" key={c.id}>
              <Avatar src={c.author.avatarUrl} name={c.author.name} size={28} />
              <div>
                <strong>{c.author.name}</strong>
                <p>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
