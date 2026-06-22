import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { getFeed, getConnections } from '../api/services';
import type { Post, Connection } from '../api/types';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFeed(), getConnections()]).then(([p, c]) => {
      setPosts(p.slice(0, 2));
      setSuggestions(c.filter((x) => x.status === 'suggested').slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (!user) return null;

  return (
    <div className="dash-grid">
      <div className="dash-main">
        <div className="dash-hero glass">
          <div className="dash-hero-text">
            <p className="eyebrow">{`{ welcome back }`}</p>
            <h1>Hey {user.name.split(' ')[0]}, ready to ship today?</h1>
            <p className="dash-hero-sub">{user.bio}</p>
            <div className="dash-hero-actions">
              <Link to="/feed" className="btn btn-primary">Open feed</Link>
              <Link to="/profile" className="btn btn-ghost">Edit profile</Link>
            </div>
          </div>
          <Avatar src={user.avatarUrl} name={user.name} size={88} status={user.status} ring />
        </div>

        <div className="dash-stats">
          <div className="dash-stat glass"><strong>{user.stats.connections}</strong><span>Connections</span></div>
          <div className="dash-stat glass"><strong>{user.stats.projects}</strong><span>Projects</span></div>
          <div className="dash-stat glass"><strong>{user.stats.posts}</strong><span>Posts</span></div>
        </div>

        <div className="dash-section-head">
          <h2>Latest from your network</h2>
          <Link to="/feed" className="eyebrow">View all →</Link>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : (
          posts.map((p) => <PostCard post={p} key={p.id} />)
        )}
      </div>

      <aside className="dash-rail">
        <div className="rail-card glass">
          <h3>Suggested connections</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : (
            suggestions.map((s) => (
              <div className="rail-suggestion" key={s.id}>
                <Avatar src={s.avatarUrl} name={s.name} size={36} />
                <div className="rail-suggestion-text">
                  <strong>{s.name}</strong>
                  <span>{s.role}</span>
                </div>
              </div>
            ))
          )}
          <Link to="/connections" className="btn btn-ghost" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>
            See all
          </Link>
        </div>

        <div className="rail-card glass">
          <h3>Skills</h3>
          <div className="rail-skills">
            {user.skills.map((s) => <span className="tag" key={s}>{s}</span>)}
          </div>
        </div>
      </aside>
    </div>
  );
}
