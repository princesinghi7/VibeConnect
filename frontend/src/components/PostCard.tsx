import { useState } from 'react';
import Avatar from './Avatar';
import type { Post } from '../api/types';
import { toggleLike } from '../api/services';
import './PostCard.css';

function timeAgo(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'recently';
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(iso));
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    const previousLiked = liked;
    const previousLikes = likes;
    const next = !previousLiked;
    setLiked(next);
    setLikes(Math.max(0, previousLikes + (next ? 1 : -1)));
    try {
      const result = await toggleLike(post.id, next);
      setLiked(result.liked);
      setLikes(result.likes);
    } catch {
      setLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/feed#${encodeURIComponent(post.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Post by ${post.author.name}`, text: post.content, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('Link copied');
        window.setTimeout(() => setShareMessage(''), 1800);
      } else {
        setShareMessage('Sharing unavailable');
        window.setTimeout(() => setShareMessage(''), 1800);
      }
    } catch {
      setShareMessage('Share cancelled');
      window.setTimeout(() => setShareMessage(''), 1800);
    }
  }

  return (
    <article className="post-card" id={post.id}>
      <header className="post-head">
        <Avatar src={post.author.avatarUrl} name={post.author.name} size={43} />
        <div className="post-author">
          <strong>{post.author.name}</strong>
          <span>{post.author.handle} <i>·</i> {timeAgo(post.createdAt)}</span>
          <small>{post.author.role}</small>
        </div>
        {post.tag && <span className="post-topic">#{post.tag}</span>}
        <span className="post-more" aria-hidden="true">•••</span>
      </header>

      <p className="post-content">{post.content}</p>

      {post.imageUrl && (
        <div className="post-media">
          <img src={post.imageUrl} alt={`Post shared by ${post.author.name}`} loading="lazy" />
        </div>
      )}

      <div className="post-engagement-summary">
        <span>{likes.toLocaleString('en-IN')} {likes === 1 ? 'reaction' : 'reactions'}</span>
        <button type="button" onClick={() => setShowComments((current) => !current)}>
          {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      <footer className="post-actions">
        <button type="button" className={`post-action${liked ? ' liked' : ''}`} onClick={handleLike} disabled={busy} aria-pressed={liked}>
          <span>{liked ? '♥' : '♡'}</span> Like
        </button>
        <button type="button" className={`post-action${showComments ? ' selected' : ''}`} onClick={() => setShowComments((current) => !current)} aria-expanded={showComments}>
          <span>▤</span> Comment
        </button>
        <button type="button" className="post-action" onClick={handleShare}>
          <span>↗</span> Share
        </button>
        {shareMessage && <span className="post-share-feedback" role="status">{shareMessage}</span>}
      </footer>

      {showComments && (
        <div className="post-comments">
          {post.comments.length === 0 && <p className="empty-comments">No comments yet. Be the first to start the conversation.</p>}
          {post.comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <Avatar src={comment.author.avatarUrl} name={comment.author.name} size={30} />
              <div className="comment-body">
                <strong>{comment.author.name}</strong>
                <p>{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
