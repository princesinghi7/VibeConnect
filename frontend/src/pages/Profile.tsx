import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Avatar from '../components/Avatar';
import YoutubeStatsCard from '../components/YoutubeStatsCard';
import InstagramEmbed from '../components/InstagramEmbed';
import FacebookPagePlugin from '../components/FacebookPagePlugin';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../api/services';
import type { User } from '../api/types';
import './Profile.css';

type ProfileDraft = {
  name: string; handle: string; role: string; location: string; bio: string;
  niche: string; skills: string; instagram: string; youtube: string; facebook: string; twitter: string;
  companyName: string; industry: string; budgetRange: string; website: string; targetNiches: string;
};

const toDraft = (user: User): ProfileDraft => ({
  name: user.name ?? '', handle: (user.handle ?? '').replace(/^@/, ''), role: user.role ?? '',
  location: user.location ?? '', bio: user.bio ?? '', niche: user.niche ?? '',
  skills: (user.skills ?? []).join(', '), instagram: user.socials?.instagram ?? '',
  youtube: user.socials?.youtube ?? '', facebook: user.socials?.facebook ?? '',
  twitter: user.socials?.twitter ?? '', companyName: user.companyName ?? '',
  industry: user.industry ?? '', budgetRange: user.budgetRange ?? '',
  website: user.website ?? '', targetNiches: (user.targetNiches ?? []).join(', '),
});

const splitList = (value: string) => [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];

function Field({ label, value, onChange, placeholder, wide = false, maxLength = 120 }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; wide?: boolean; maxLength?: number;
}) {
  return <label className={`profile-field${wide ? ' profile-field-wide' : ''}`}><span>{label}</span><input value={value} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(user ? toDraft(user) : null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'avatarUrl' | 'coverUrl' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<'avatarUrl' | 'coverUrl'>('avatarUrl');

  useEffect(() => { if (user && !editing) setDraft(toDraft(user)); }, [user, editing]);

  const completion = useMemo(() => {
    if (!user) return 0;
    const checks = [user.name, user.handle, user.avatarUrl, user.coverUrl, user.bio, user.location, user.role,
      user.accountType === 'creator' ? user.niche : user.industry,
      user.accountType === 'creator' ? user.socials?.instagram || user.socials?.youtube || user.socials?.facebook : user.website,
      user.skills?.length];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [user]);

  if (!user || !draft) return null;
  const profileUser = user;
  const formDraft = draft;

  const set = (key: keyof ProfileDraft, value: string) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  function startEdit() { setDraft(toDraft(profileUser)); setEditing(true); }
  function cancelEdit() { setDraft(toDraft(profileUser)); setEditing(false); }

  async function saveProfile(event?: FormEvent) {
    event?.preventDefault();
    if (!formDraft.name.trim() || !formDraft.handle.trim()) {
      notify('Name and username are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const patch: Partial<User> = {
        name: formDraft.name.trim(), handle: formDraft.handle.trim().replace(/^@/, ''),
        role: formDraft.role.trim(), location: formDraft.location.trim(), bio: formDraft.bio.trim(),
        skills: splitList(formDraft.skills),
        socials: {
          ...(profileUser.socials ?? {}),
          instagram: formDraft.instagram.trim(), youtube: formDraft.youtube.trim(),
          facebook: formDraft.facebook.trim(), twitter: formDraft.twitter.trim(),
        },
      };
      if (profileUser.accountType === 'creator') patch.niche = formDraft.niche.trim();
      if (profileUser.accountType === 'brand') {
        patch.companyName = formDraft.companyName.trim();
        patch.industry = formDraft.industry.trim();
        patch.budgetRange = formDraft.budgetRange.trim();
        patch.website = formDraft.website.trim();
        patch.targetNiches = splitList(formDraft.targetNiches);
      }
      const updated = await updateProfile(patch);
      updateUser(updated);
      setDraft(toDraft(updated));
      setEditing(false);
      notify('Your profile has been updated.');
    } catch {
      notify('Could not save your profile. Please try again.', 'error');
    } finally { setSaving(false); }
  }

  function choosePhoto(target: 'avatarUrl' | 'coverUrl') {
    uploadTarget.current = target;
    fileInput.current?.click();
  }

  async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = uploadTarget.current;
    if (!file) return;
    event.target.value = '';
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      notify('Choose a JPG, PNG, WEBP or GIF image.', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('Image must be smaller than 10 MB.', 'error'); return;
    }
    setUploading(target);
    try {
      const token = localStorage.getItem('vc_token');
      const response = await fetch('/api/upload', {
        method: 'POST', headers: { 'Content-Type': file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: file,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Image upload failed');
      }
      const data = await response.json() as { url?: string };
      if (!data.url) throw new Error('The server did not return an image URL.');
      const updated = await updateProfile({ [target]: data.url });
      updateUser(updated);
      notify(target === 'avatarUrl' ? 'Profile photo updated.' : 'Cover image updated.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Image upload failed. Please try again.', 'error');
    } finally { setUploading(null); }
  }

  const isCreator = user.accountType === 'creator';
  const socials = [
    { name: 'Instagram', value: user.socials?.instagram, className: 'instagram' },
    { name: 'YouTube', value: user.socials?.youtube, className: 'youtube' },
    { name: 'Facebook', value: user.socials?.facebook, className: 'facebook' },
    { name: 'X', value: user.socials?.twitter, className: 'twitter' },
  ].filter((item) => item.value);
  const youtubeHandle = user.socials?.youtube?.match(/@([\w.-]+)/)?.[1];

  return (
    <div className="profile-page">
      {toast && <div className={`profile-toast profile-toast-${toast.type}`} role="status">{toast.type === 'success' ? '✓' : '!'} {toast.message}</div>}
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onFileChosen} />

      <header className="profile-page-header">
        <div><span className="profile-eyebrow">YOUR VIBECONNECT IDENTITY</span><h1>My profile</h1><p>Make a strong first impression. Keep your profile polished, clear and ready for opportunities.</p></div>
        {!editing && <button className="profile-action profile-action-primary" onClick={startEdit}>✎ Edit profile</button>}
      </header>

      <section className="profile-hero">
        <div className="profile-cover">
          {user.coverUrl ? <img src={user.coverUrl} alt="" className="profile-cover-image" /> : <div className="profile-cover-placeholder" />}
          <div className="profile-cover-shade" />
          <button className="profile-cover-edit" onClick={() => choosePhoto('coverUrl')} disabled={uploading !== null}>{uploading === 'coverUrl' ? 'Uploading…' : '▧ Change cover'}</button>
          {uploading === 'coverUrl' && <div className="profile-upload-progress">Uploading cover image…</div>}
        </div>
        <div className="profile-hero-content">
          <div className="profile-avatar-column">
            <div className="profile-avatar-frame"><Avatar src={user.avatarUrl} name={user.name} size={112} status={user.status} ring />
              <button className="profile-avatar-edit" onClick={() => choosePhoto('avatarUrl')} disabled={uploading !== null} aria-label="Change profile photo">{uploading === 'avatarUrl' ? '…' : '✎'}</button>
            </div>
            <span className="profile-photo-hint">JPG, PNG or WEBP · 10 MB max</span>
          </div>
          <div className="profile-identity">
            <div className="profile-identity-top"><div><span className="profile-account-label">{isCreator ? 'CREATOR ACCOUNT' : 'BRAND ACCOUNT'}</span><h2>{user.name}</h2><p className="profile-handle">@{user.handle.replace(/^@/, '')}</p></div><span className={`profile-status profile-status-${user.status}`}><i />{user.status === 'building' ? 'Building' : user.status}</span></div>
            <p className="profile-role-line">{user.role || (isCreator ? 'Content Creator' : 'Brand')}</p>
            <div className="profile-meta-line">{user.location && <span>⌖ {user.location}</span>}{isCreator && user.niche && <span>✦ {user.niche}</span>}{!isCreator && user.industry && <span>▤ {user.industry}</span>}</div>
            <p className="profile-bio-preview">{user.bio || 'Add a short introduction to tell the community who you are and what you do.'}</p>
            {socials.length > 0 && <div className="profile-social-links">{socials.map((item) => <span className={`profile-social-chip ${item.className}`} key={item.name}>{item.name} <b>↗</b></span>)}</div>}
          </div>
          <aside className="profile-completion">
            <div className="profile-completion-head"><span>PROFILE STRENGTH</span><strong>{completion}%</strong></div>
            <div className="profile-completion-track"><i style={{ width: `${completion}%` }} /></div>
            <p>{completion >= 90 ? 'Excellent — your profile is looking great.' : 'Complete your details to help brands and creators discover you.'}</p>
            <button onClick={startEdit}>Improve profile <span>→</span></button>
          </aside>
        </div>
      </section>

      <section className="profile-metrics">
        {isCreator ? <>
          <div className="profile-metric"><span>FOLLOWERS</span><strong>{(user.followers ?? 0).toLocaleString('en-IN')}</strong><small>Across your connected audience</small></div>
          <div className="profile-metric"><span>ENGAGEMENT RATE</span><strong>{user.engagementRate ?? 0}%</strong><small>Audience interaction</small></div>
          <div className="profile-metric"><span>CONNECTIONS</span><strong>{user.stats.connections}</strong><small>Creator & brand network</small></div>
        </> : <>
          <div className="profile-metric"><span>CONNECTIONS</span><strong>{user.stats.connections}</strong><small>Your professional network</small></div>
          <div className="profile-metric"><span>CAMPAIGNS</span><strong>{user.stats.projects}</strong><small>Campaign activity</small></div>
          <div className="profile-metric"><span>UPDATES</span><strong>{user.stats.posts}</strong><small>Published posts</small></div>
        </>}
      </section>

      {editing && <form className="profile-editor profile-panel" onSubmit={saveProfile}>
        <div className="profile-panel-heading"><div><span className="profile-eyebrow">PROFILE SETTINGS</span><h2>Edit your details</h2><p>Keep your information accurate so the right people can find you.</p></div><span className="profile-edit-badge">EDITING</span></div>
        <div className="profile-form-grid">
          <Field label="Display name *" value={draft.name} onChange={(v) => set('name', v)} placeholder="Your name" />
          <Field label="Username *" value={draft.handle} onChange={(v) => set('handle', v)} placeholder="yourusername" />
          <Field label="Professional title" value={draft.role} onChange={(v) => set('role', v)} placeholder={isCreator ? 'Content Creator' : 'Marketing Manager'} />
          <Field label="Location" value={draft.location} onChange={(v) => set('location', v)} placeholder="City, Country" />
          {isCreator ? <Field label="Content niche" value={draft.niche} onChange={(v) => set('niche', v)} placeholder="Lifestyle, Tech, Fashion…" /> : <>
            <Field label="Company name" value={draft.companyName} onChange={(v) => set('companyName', v)} placeholder="Your company" />
            <Field label="Industry" value={draft.industry} onChange={(v) => set('industry', v)} placeholder="Food, Fashion, Technology…" />
            <Field label="Typical campaign budget" value={draft.budgetRange} onChange={(v) => set('budgetRange', v)} placeholder="₹10,000 – ₹50,000" />
            <Field label="Website" value={draft.website} onChange={(v) => set('website', v)} placeholder="https://yourbrand.com" />
            <Field label="Target creator niches" value={draft.targetNiches} onChange={(v) => set('targetNiches', v)} placeholder="Lifestyle, Travel, Tech…" wide />
          </>}
          <label className="profile-field profile-field-wide"><span>About you</span><textarea rows={4} maxLength={500} value={draft.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Introduce yourself, your content, audience or brand in a few clear sentences…" /><small>{draft.bio.length}/500 characters</small></label>
          <Field label={isCreator ? 'Skills & content formats' : 'Services & strengths'} value={draft.skills} onChange={(v) => set('skills', v)} placeholder="Reels, Storytelling, Photography (comma separated)" wide />
          <div className="profile-form-divider profile-field-wide"><span>SOCIAL & ONLINE PRESENCE</span></div>
          <Field label="Instagram URL or @username" value={draft.instagram} onChange={(v) => set('instagram', v)} placeholder="https://instagram.com/username" />
          <Field label="YouTube URL or channel handle" value={draft.youtube} onChange={(v) => set('youtube', v)} placeholder="https://youtube.com/@channel" />
          <Field label="Facebook URL" value={draft.facebook} onChange={(v) => set('facebook', v)} placeholder="https://facebook.com/page" />
          <Field label="X / Twitter URL or @username" value={draft.twitter} onChange={(v) => set('twitter', v)} placeholder="https://x.com/username" />
        </div>
        <div className="profile-editor-actions"><button type="button" className="profile-action profile-action-quiet" onClick={cancelEdit} disabled={saving}>Cancel</button><button type="submit" className="profile-action profile-action-primary" disabled={saving}>{saving ? 'Saving profile…' : 'Save profile changes'}</button></div>
      </form>}

      <div className="profile-content-grid">
        <main className="profile-content-main">
          <section className="profile-panel">
            <div className="profile-panel-heading"><div><span className="profile-eyebrow">INTRODUCTION</span><h2>About</h2></div>{!editing && <button className="profile-text-action" onClick={startEdit}>Edit details ↗</button>}</div>
            <p className="profile-about-text">{user.bio || 'Your introduction will appear here once you add it to your profile.'}</p>
          </section>
          {isCreator && <section className="profile-panel">
            <div className="profile-panel-heading"><div><span className="profile-eyebrow">CONTENT & COMMUNITY</span><h2>Social presence</h2><p>Connected social channels and creator profile previews.</p></div></div>
            {!socials.length ? <div className="profile-empty"><strong>No social accounts added yet</strong><span>Add your Instagram, YouTube or Facebook details to make your creator profile more discoverable.</span><button className="profile-text-action" onClick={startEdit}>Add social links →</button></div> : <div className="profile-social-preview">
              {user.socials?.youtube && youtubeHandle && <YoutubeStatsCard handle={youtubeHandle} url={user.socials.youtube} />}
              {user.socials?.instagram && <InstagramEmbed postUrl={user.socials.instagramPostUrl} profileUrl={user.socials.instagram} />}
              {user.socials?.facebook && <FacebookPagePlugin pageUrl={user.socials.facebook} />}
              {socials.map((item) => <div className="profile-connected-row" key={item.name}><span className={`profile-social-mark ${item.className}`}>{item.name.slice(0,1)}</span><span>{item.name}</span><b>Added</b></div>)}
            </div>}
          </section>}
          {!isCreator && <section className="profile-panel"><div className="profile-panel-heading"><div><span className="profile-eyebrow">COMPANY INFORMATION</span><h2>Brand details</h2></div><button className="profile-text-action" onClick={startEdit}>Edit details ↗</button></div><div className="profile-brand-grid"><div><span>COMPANY</span><strong>{user.companyName || 'Not added'}</strong></div><div><span>INDUSTRY</span><strong>{user.industry || 'Not added'}</strong></div><div><span>TYPICAL BUDGET</span><strong>{user.budgetRange || 'Not added'}</strong></div><div><span>WEBSITE</span><strong>{user.website || 'Not added'}</strong></div></div>{(user.targetNiches ?? []).length > 0 && <div className="profile-tag-list">{user.targetNiches?.map((n) => <span key={n}>{n}</span>)}</div>}</section>}
          <section className="profile-panel"><div className="profile-panel-heading"><div><span className="profile-eyebrow">WHAT YOU BRING</span><h2>{isCreator ? 'Skills & content formats' : 'Services & strengths'}</h2></div><button className="profile-text-action" onClick={startEdit}>Edit ↗</button></div><div className="profile-tag-list">{user.skills?.length ? user.skills.map((skill) => <span key={skill}>{skill}</span>) : <div className="profile-empty-inline">No skills added yet. <button onClick={startEdit}>Add skills</button></div>}</div></section>
        </main>
        <aside className="profile-content-side">
          <section className="profile-panel profile-side-card"><span className="profile-eyebrow">PROFILE VISIBILITY</span><h3>Make your next connection count.</h3><p>A complete profile gives potential partners a clearer picture of who you are and what you bring to a collaboration.</p><button className="profile-action profile-action-primary" onClick={startEdit}>Review my profile</button></section>
          <section className="profile-panel profile-side-card"><span className="profile-eyebrow">QUICK CHECKLIST</span><h3>Profile essentials</h3><ul className="profile-checklist"><li className={user.avatarUrl ? 'is-done' : ''}><i>{user.avatarUrl ? '✓' : '○'}</i> Profile photo</li><li className={user.bio ? 'is-done' : ''}><i>{user.bio ? '✓' : '○'}</i> Introduction</li><li className={user.location ? 'is-done' : ''}><i>{user.location ? '✓' : '○'}</i> Location</li><li className={(user.skills?.length ?? 0) ? 'is-done' : ''}><i>{user.skills?.length ? '✓' : '○'}</i> Skills & strengths</li><li className={socials.length ? 'is-done' : ''}><i>{socials.length ? '✓' : '○'}</i> Social presence</li></ul></section>
        </aside>
      </div>
    </div>
  );
}
