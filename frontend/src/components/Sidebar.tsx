import { NavLink } from 'react-router-dom';
import Avatar from './Avatar';
import { useAuth } from '../hooks/useAuth';
import './Sidebar.css';

const baseLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '◧' },
  { to: '/feed', label: 'Feed', icon: '✦' },
];

const creatorLinks = [
  { to: '/discover', label: 'Discover Brands', icon: '◎' },
  { to: '/campaigns', label: 'Campaigns', icon: '◇' },
  { to: '/connections', label: 'Connections', icon: '◑' },
  { to: '/messages', label: 'Messages', icon: '◐' },
  { to: '/analytics', label: 'Analytics', icon: '◫' },
  { to: '/media-kit', label: 'Media Kit', icon: '▣' },
];

const brandLinks = [
  { to: '/discover', label: 'Discover Creators', icon: '◎' },
  { to: '/campaigns', label: 'Campaigns', icon: '◇' },
  { to: '/connections', label: 'Connections', icon: '◑' },
  { to: '/messages', label: 'Messages', icon: '◐' },
];

const tailLinks = [
  { to: '/ai-assistant', label: 'AI Assistant', icon: '✺' },
  { to: '/profile', label: 'Profile', icon: '◉' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const roleLinks = user?.accountType === 'brand' ? brandLinks : creatorLinks;
  const links = [...baseLinks, ...roleLinks, ...tailLinks];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">{'</'}</span>
        <span className="brand-name">VibeConnect</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="sidebar-foot">
          <div className="sidebar-me">
            <Avatar src={user.avatarUrl} name={user.name} size={38} status={user.status} />
            <div className="sidebar-me-text">
              <strong>{user.name}</strong>
              <span>{user.handle}</span>
            </div>
          </div>
          <button className="btn btn-ghost sidebar-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
