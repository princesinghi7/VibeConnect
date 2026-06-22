import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../api/services';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setBio(user?.bio ?? ''), [user?.bio]);

  if (!user) return null;

  function handlePhotoPick(kind: 'avatarUrl' | 'coverUrl') {
    fileInput.current?.setAttribute('data-target', kind);
    fileInput.current?.click();
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = e.target.getAttribute('data-target') as 'avatarUrl' | 'coverUrl' | null;
    if (!file || !target) return;
    const url = URL.createObjectURL(file);
    const patch = { [target]: url } as Partial<import('../api/types').User>;
    updateUser(patch);
    updateProfile(patch);
    e.target.value = '';
  }

  async function saveBio() {
    setSaving(true);
    try {
      const updated = await updateProfile({ bio });
      updateUser(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-page">
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFileChosen} />

      <div className="profile-cover glass">
        <img src={user.coverUrl} alt="" className="cover-img" />
        <button className="btn btn-ghost cover-edit" onClick={() => handlePhotoPick('coverUrl')}>
          Change cover
        </button>

        <div className="profile-id-row">
          <div className="profile-avatar-wrap">
            <Avatar src={user.avatarUrl} name={user.name} size={104} status={user.status} ring />
            <button className="avatar-edit-btn" onClick={() => handlePhotoPick('avatarUrl')} aria-label="Change profile photo">
              ✎
            </button>
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
            {!editing && <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>}
          </div>
          {editing ? (
            <>
              <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
              <div className="profile-edit-actions">
                <button className="btn btn-ghost" onClick={() => { setEditing(false); setBio(user.bio); }}>Cancel</button>
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
            <div className="profile-socials">
              {user.socials?.instagram && (
                <a href={user.socials.instagram} target="_blank" rel="noreferrer" className="tag">Instagram</a>
              )}
              {user.socials?.youtube && (
                <a href={user.socials.youtube} target="_blank" rel="noreferrer" className="tag">YouTube</a>
              )}
              {user.socials?.facebook && (
                <a href={user.socials.facebook} target="_blank" rel="noreferrer" className="tag">Facebook</a>
              )}
              {!user.socials?.instagram && !user.socials?.youtube && !user.socials?.facebook && (
                <p className="eyebrow">No social links added yet.</p>
              )}
            </div>
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
