import { useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import YoutubeStatsCard from '../components/YoutubeStatsCard';
import InstagramEmbed from '../components/InstagramEmbed';
import FacebookPagePlugin from '../components/FacebookPagePlugin';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../api/services';
import './Profile.css';

function youtubeHandleFromUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/@([\w.-]+)/);
  return match ? match[1] : null;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!user) return null;

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handlePhotoPick(kind: 'avatarUrl' | 'coverUrl') {
    fileInput.current?.setAttribute('data-target', kind);
    fileInput.current?.click();
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = e.target.getAttribute('data-target') as 'avatarUrl' | 'coverUrl' | null;
    if (!file || !target || !user) return;

    // Local preview URL
    const previewUrl = URL.createObjectURL(file);
    const originalUrl = target === 'avatarUrl' ? user.avatarUrl : user.coverUrl;

    // Optimistic UI update
    updateUser({ [target]: previewUrl });
    setUploading(true);
    showToast('Uploading image...', 'success');

    try {
      const token = localStorage.getItem('vc_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'Authorization': `Bearer ${token}`,
        },
        body: file,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      const finalUrl = data.url;

      // Update in API database
      const updated = await updateProfile({ [target]: finalUrl });
      updateUser(updated);
      showToast('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      // Revert optimistic change
      updateUser({ [target]: originalUrl });
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function saveBio() {
    setSaving(true);
    try {
      const updated = await updateProfile({ bio });
      updateUser(updated);
      setBio(updated.bio ?? '');
      setEditing(false);
      showToast('Bio updated!');
    } catch {
      showToast('Failed to update bio.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-page">
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFileChosen} />

      <div className="profile-cover glass">
        <img src={user.coverUrl} alt="" className="cover-img" />
        {uploading ? (
          <div className="cover-loading-overlay">Uploading...</div>
        ) : (
          <button className="btn btn-ghost cover-edit" onClick={() => handlePhotoPick('coverUrl')}>
            Change cover
          </button>
        )}

        <div className="profile-id-row">
          <div className="profile-avatar-wrap">
            <Avatar src={user.avatarUrl} name={user.name} size={120} status={user.status} ring />
            {uploading ? (
              <div className="avatar-loading-overlay">
                <span className="spinner" />
              </div>
            ) : (
              <button className="avatar-edit-btn" onClick={() => handlePhotoPick('avatarUrl')} aria-label="Change profile photo">
                ✎
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-main">
        <div className="profile-heading">
          <div>
            <h1>{user.name}</h1>
            <p className="profile-handle">{user.handle} · {user.location}</p>
            <p className="profile-role">{user.role}</p>
          </div>
          <span className={`status-pill status-${user.status}`}>
            <span className="pulse-dot" /> {user.status === 'building' ? 'building' : user.status}
          </span>
        </div>

        <div className="profile-stats">
          {user.accountType === 'creator' ? (
            <>
              <div><strong>{(user.followers ?? 0).toLocaleString('en-IN')}</strong><span>Followers</span></div>
              <div><strong>{user.engagementRate ?? 0}%</strong><span>Engagement</span></div>
              <div><strong>{user.stats.connections}</strong><span>Connections</span></div>
            </>
          ) : (
            <>
              <div><strong>{user.stats.connections}</strong><span>Connections</span></div>
              <div><strong>{user.stats.projects}</strong><span>Campaigns</span></div>
              <div><strong>{user.stats.posts}</strong><span>Posts</span></div>
            </>
          )}
        </div>

        {user.accountType === 'creator' && user.niche && (
          <div className="profile-niche-row">
            <span className="eyebrow">Niche</span>
            <span className="tag">{user.niche}</span>
          </div>
        )}

        <section className="profile-section glass">
          <div className="profile-section-head">
            <h2>About</h2>
            {!editing && <button className="btn btn-ghost" onClick={() => { setBio(user.bio ?? ''); setEditing(true); }}>Edit</button>}
          </div>
          {editing ? (
            <>
              <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
              <div className="profile-edit-actions">
                <button className="btn btn-ghost" onClick={() => { setEditing(false); setBio(user.bio ?? ''); }}>Cancel</button>
                <button className="btn btn-primary" onClick={saveBio} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </>
          ) : (
            <p className="profile-bio">{user.bio}</p>
          )}
        </section>

        {user.accountType === 'creator' && (
          <section className="profile-section glass">
            <h2>Socials</h2>
            {!user.socials?.instagram && !user.socials?.youtube && !user.socials?.facebook ? (
              <p className="eyebrow">No social links added yet.</p>
            ) : (
              <div className="profile-social-embeds">
                {user.socials?.youtube && youtubeHandleFromUrl(user.socials.youtube) && (
                  <YoutubeStatsCard handle={youtubeHandleFromUrl(user.socials.youtube)!} url={user.socials.youtube} />
                )}
                {user.socials?.instagram && (
                  <InstagramEmbed postUrl={user.socials.instagramPostUrl} profileUrl={user.socials.instagram} />
                )}
                {user.socials?.facebook && (
                  <FacebookPagePlugin pageUrl={user.socials.facebook} />
                )}
              </div>
            )}
          </section>
        )}

        {user.accountType === 'brand' && (
          <section className="profile-section glass">
            <h2>Brand details</h2>
            <div className="profile-brand-grid">
              <div><span className="eyebrow">Industry</span><p>{user.industry || '—'}</p></div>
              <div><span className="eyebrow">Typical budget</span><p>{user.budgetRange || '—'}</p></div>
              <div>
                <span className="eyebrow">Target niches</span>
                <div className="profile-skills" style={{ marginTop: 6 }}>
                  {(user.targetNiches ?? []).map((n) => <span className="tag" key={n}>{n}</span>)}
                  {(!user.targetNiches || user.targetNiches.length === 0) && <p>—</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="profile-section glass">
          <h2>Skills</h2>
          <div className="profile-skills">
            {user.skills.map((s) => <span className="tag" key={s}>{s}</span>)}
            {user.skills.length === 0 && <p className="eyebrow">No skills added yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
