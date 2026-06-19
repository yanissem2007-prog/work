'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User as UserIcon, Link2, Shield, Sun, Moon, Bell, BellOff, LogOut, Check, Camera,
  X, Loader2, Plus, Github, Linkedin, Twitter, Globe, Dribbble, ArrowUpRight, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Textarea } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { cn } from '@/lib/utils';

type TabId = 'profile' | 'connections' | 'account' | 'security' | 'appearance' | 'notifications';

const TABS: { id: TabId; label: string; icon: typeof UserIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'account', label: 'Account', icon: Briefcase },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'notifications', label: 'Notifications', icon: Bell }
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="font-display text-3xl tracking-tighter">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your profile, account and preferences.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
        {/* Vertical tab nav */}
        <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible -mx-1 px-1 pb-1 sm:pb-0">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors shrink-0',
                  active ? 'text-fg' : 'text-muted hover:text-fg hover:bg-surface'
                )}
              >
                {active && (
                  <motion.span layoutId="settings-tab"
                    className="absolute inset-0 rounded-xl bg-surface-2 border border-border"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
                <t.icon size={16} className="relative z-10 shrink-0" />
                <span className="relative z-10 font-medium">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="min-w-0">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'connections' && <ConnectionsTab />}
          {tab === 'account' && <AccountTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── shared helpers ─────────────── */

function Panel({ title, desc, children, footer }: { title: string; desc?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <h2 className="font-display text-lg tracking-tight">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
      {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
    </div>
  );
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}` },
    body: fd
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? 'Upload failed');
  }
  return (await res.json()).url as string;
}

/* ─────────────── Profile ─────────────── */

function ProfileTab() {
  const qc = useQueryClient();
  const storeUser = useAuthStore((s) => s.user);
  const setStoreUser = useAuthStore((s) => s.setUser);
  const handle = storeUser?.handle;
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-profile', handle],
    enabled: !!handle,
    queryFn: async () => (await api.get(`/users/${handle}`)).data.data
  });

  const [form, setForm] = useState({
    name: '', headline: '', bio: '', location: '', avatar: '', skills: [] as string[]
  });
  const [profile, setProfile] = useState({ cover: '', openToWork: false, hiring: false });
  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState<false | 'avatar' | 'cover'>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? '', headline: data.headline ?? '', bio: data.bio ?? '',
      location: data.location ?? '', avatar: data.avatar ?? '', skills: data.skills ?? []
    });
    setProfile({
      cover: data.profile?.cover ?? '',
      openToWork: !!data.profile?.openToWork,
      hiring: !!data.profile?.hiring
    });
  }, [data]);

  async function pick(kind: 'avatar' | 'cover', file?: File) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadImage(file);
      if (kind === 'avatar') setForm((f) => ({ ...f, avatar: url }));
      else setProfile((p) => ({ ...p, cover: url }));
      toast.success('Image uploaded');
    } catch (e: any) {
      toast.error(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 40) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput('');
  }

  async function save() {
    setSaving(true);
    try {
      const { data: updated } = await api.patch('/users/me', {
        name: form.name, headline: form.headline, bio: form.bio,
        location: form.location, skills: form.skills,
        avatar: form.avatar || undefined
      });
      await api.patch('/users/me/profile', {
        cover: profile.cover || undefined,
        openToWork: profile.openToWork, hiring: profile.hiring
      });
      // reflect immediately in topbar/sidebar
      if (updated?.data) setStoreUser({ ...(storeUser as any), ...updated.data });
      qc.invalidateQueries({ queryKey: ['profile', handle] });
      qc.invalidateQueries({ queryKey: ['settings-profile', handle] });
      toast.success('Profile saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <Panel title="Profile"><div className="grid place-items-center py-10"><Loader2 className="animate-spin text-muted" /></div></Panel>;

  return (
    <Panel
      title="Profile"
      desc="This is how you appear across WORK."
      footer={<Button variant="accent" magnetic loading={saving} onClick={save}><Check size={14} /> Save changes</Button>}
    >
      {/* Banner + avatar */}
      <div className="relative">
        <button
          onClick={() => coverInput.current?.click()}
          className="group relative block w-full h-32 rounded-xl overflow-hidden border border-border bg-grad-aurora"
          aria-label="Change banner"
        >
          {profile.cover && <img src={profile.cover} alt="" className="w-full h-full object-cover" />}
          <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition text-white text-xs">
            {uploading === 'cover' ? <Loader2 size={18} className="animate-spin" /> : <><Camera size={16} className="mr-1.5" /> Change banner</>}
          </span>
        </button>
        <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick('cover', e.target.files?.[0])} />

        <div className="absolute -bottom-6 left-4">
          <button onClick={() => avatarInput.current?.click()} className="group relative rounded-full ring-4 ring-bg" aria-label="Change photo">
            <Avatar src={form.avatar} name={form.name || 'You'} size="xl" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition text-white">
              {uploading === 'avatar' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </span>
          </button>
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick('avatar', e.target.files?.[0])} />
        </div>
      </div>
      <div className="h-6" />

      <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Headline" placeholder="e.g. Senior Frontend Engineer" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
      <Input label="Location" placeholder="e.g. Algiers, Algeria" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <Textarea label="Bio" placeholder="Tell people who you are…" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="min-h-28" />

      {/* Skills */}
      <div>
        <label className="text-xs font-medium text-fg-soft tracking-snug">Skills</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {form.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-pill bg-surface-2 border border-border px-2.5 py-1 text-xs">
              {s}
              <button onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))} aria-label={`Remove ${s}`} className="text-muted hover:text-danger">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input value={skillInput} placeholder="Add a skill…" onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
          <Button variant="glass" onClick={addSkill}><Plus size={14} /></Button>
        </div>
      </div>

      {/* Status toggles */}
      <div className="flex flex-wrap gap-3 pt-1">
        <Toggle label="Open to work" checked={profile.openToWork} onChange={() => setProfile((p) => ({ ...p, openToWork: !p.openToWork }))} />
        <Toggle label="Hiring" checked={profile.hiring} onChange={() => setProfile((p) => ({ ...p, hiring: !p.hiring }))} />
      </div>
    </Panel>
  );
}

/* ─────────────── Connections ─────────────── */

const SOCIALS: { key: string; label: string; icon: typeof Github; ph: string }[] = [
  { key: 'github', label: 'GitHub', icon: Github, ph: 'https://github.com/you' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, ph: 'https://linkedin.com/in/you' },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter, ph: 'https://x.com/you' },
  { key: 'website', label: 'Website', icon: Globe, ph: 'https://yoursite.com' },
  { key: 'dribbble', label: 'Dribbble', icon: Dribbble, ph: 'https://dribbble.com/you' }
];

function ConnectionsTab() {
  const qc = useQueryClient();
  const handle = useAuthStore((s) => s.user?.handle);
  const { data, isLoading } = useQuery({
    queryKey: ['settings-profile', handle],
    enabled: !!handle,
    queryFn: async () => (await api.get(`/users/${handle}`)).data.data
  });
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data?.profile?.socials) setSocials(data.profile.socials); }, [data]);

  async function save() {
    setSaving(true);
    try {
      await api.patch('/users/me/profile', { socials });
      qc.invalidateQueries({ queryKey: ['profile', handle] });
      toast.success('Links saved');
    } catch {
      toast.error('Could not save');
    } finally { setSaving(false); }
  }

  if (isLoading) return <Panel title="Connections"><div className="grid place-items-center py-10"><Loader2 className="animate-spin text-muted" /></div></Panel>;

  return (
    <Panel
      title="Connections"
      desc="Links shown on your public profile."
      footer={<Button variant="accent" magnetic loading={saving} onClick={save}><Check size={14} /> Save links</Button>}
    >
      {SOCIALS.map((s) => (
        <Input key={s.key} label={s.label} leading={<s.icon size={15} />} placeholder={s.ph}
          value={socials[s.key] ?? ''} onChange={(e) => setSocials((v) => ({ ...v, [s.key]: e.target.value }))} />
      ))}
    </Panel>
  );
}

/* ─────────────── Account ─────────────── */

function AccountTab() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  async function logout() {
    try { await api.post('/auth/logout'); } catch { /* clear locally regardless */ }
    logoutStore();
    router.push('/login');
  }

  return (
    <Panel title="Account" desc="Your account details.">
      <Field label="Email" value={user?.email ?? '—'} />
      <Field label="Username" value={`@${user?.handle ?? ''}`} />
      <Field label="Role" value={user?.role ?? '—'} />
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="glass" asChild>
          <Link href={`/profile/${user?.handle}`}>View public profile <ArrowUpRight size={14} /></Link>
        </Button>
        <Button variant="glass" onClick={logout} className="text-danger hover:text-danger">
          <LogOut size={14} /> Log out
        </Button>
      </div>
    </Panel>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-3.5 py-2.5">
      <span className="text-xs uppercase tracking-caps text-muted">{label}</span>
      <span className="text-sm font-medium capitalize truncate">{value}</span>
    </div>
  );
}

/* ─────────────── Security ─────────────── */

function SecurityTab() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (next.length < 8) return toast.error('New password must be at least 8 characters');
    if (next !== confirm) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: cur, newPassword: next });
      setCur(''); setNext(''); setConfirm('');
      toast.success('Password changed');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not change password');
    } finally { setSaving(false); }
  }

  return (
    <Panel
      title="Security"
      desc="Change your password. This signs out other devices."
      footer={<Button variant="accent" magnetic loading={saving} disabled={!cur || !next || !confirm} onClick={submit}>Update password</Button>}
    >
      <Input label="Current password" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
      <Input label="New password" type="password" hint="At least 8 characters." value={next} onChange={(e) => setNext(e.target.value)} />
      <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
        error={confirm && next !== confirm ? 'Does not match' : undefined} />
    </Panel>
  );
}

/* ─────────────── Appearance ─────────────── */

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  return (
    <Panel title="Appearance" desc="How WORK looks for you.">
      <Row label="Theme" hint="Light like LinkedIn, dark like X.">
        <div className="inline-flex rounded-pill border border-border p-0.5">
          {[{ id: 'light', label: 'Light', icon: <Sun size={14} /> }, { id: 'dark', label: 'Dark', icon: <Moon size={14} /> }].map((o) => {
            const active = theme === o.id;
            return (
              <button key={o.id} onClick={() => setTheme(o.id)}
                className={cn('relative inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}>
                {active && <motion.span layoutId="appearance-theme" className="absolute inset-0 rounded-pill bg-surface-2 border border-border" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <span className="relative z-10 inline-flex items-center gap-1.5">{o.icon} {o.label}</span>
              </button>
            );
          })}
        </div>
      </Row>
      <Row label="Language" hint="Interface language."><LanguageSwitcher /></Row>
    </Panel>
  );
}

/* ─────────────── Notifications ─────────────── */

const NOTIF_GROUPS: { label: string; types: { id: string; label: string }[] }[] = [
  { label: 'Social', types: [
    { id: 'like', label: 'Likes on your posts' }, { id: 'comment', label: 'Comments' },
    { id: 'follow', label: 'New followers' }, { id: 'friend_request', label: 'Connection requests' }
  ]},
  { label: 'Messages & jobs', types: [
    { id: 'message', label: 'Direct messages' }, { id: 'job_match', label: 'New job matches' },
    { id: 'application_status', label: 'Application updates' }
  ]},
  { label: 'System', types: [
    { id: 'badge_unlocked', label: 'Badges unlocked' }, { id: 'level_up', label: 'Level ups' },
    { id: 'system', label: 'Product updates' }
  ]}
];
const MUTE_OPTIONS = [{ label: 'Off', hours: 0 }, { label: '1h', hours: 1 }, { label: '8h', hours: 8 }, { label: '24h', hours: 24 }, { label: '1 week', hours: 168 }];

function NotificationsTab() {
  const { data } = useQuery<{ push?: Record<string, boolean>; mutedUntil?: string | null }>({
    queryKey: ['notif-prefs'],
    queryFn: async () => (await api.get('/notifications/prefs')).data.data
  });
  const [push, setPush] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data?.push) setPush({ ...data.push }); }, [data]);

  const mutedHours = useMemo(() => {
    if (!data?.mutedUntil) return 0;
    const diff = (new Date(data.mutedUntil).getTime() - Date.now()) / 3_600_000;
    return diff <= 0 ? 0 : MUTE_OPTIONS.reduce((b, o) => (Math.abs(o.hours - diff) < Math.abs(b - diff) ? o.hours : b), 0);
  }, [data]);

  async function savePush() {
    setSaving(true);
    try { await api.patch('/notifications/prefs', { push }); setDirty(false); toast.success('Preferences saved'); }
    catch { toast.error('Could not save'); } finally { setSaving(false); }
  }
  async function setMute(hours: number) {
    try { await api.patch('/notifications/prefs', { mutedHours: hours }); toast.success(hours ? `Muted ${hours >= 24 ? hours / 24 + 'd' : hours + 'h'}` : 'Unmuted'); }
    catch { toast.error('Could not update'); }
  }

  return (
    <Panel
      title="Notifications"
      desc="Choose what reaches you."
      footer={dirty ? <Button variant="accent" magnetic loading={saving} onClick={savePush}><Check size={14} /> Save</Button> : undefined}
    >
      <Row label="Pause all" hint="Temporarily mute everything.">
        <div className="flex flex-wrap gap-1.5">
          {MUTE_OPTIONS.map((o) => (
            <button key={o.hours} onClick={() => setMute(o.hours)}
              className={cn('inline-flex items-center gap-1 rounded-pill border px-3 py-1.5 text-xs transition-colors',
                mutedHours === o.hours ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg')}>
              {o.hours > 0 && o.hours === mutedHours && <BellOff size={11} />}{o.label}
            </button>
          ))}
        </div>
      </Row>
      {NOTIF_GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-caps text-muted-2">{g.label}</p>
          <div className="divide-y divide-border rounded-xl border border-border">
            {g.types.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                <span className="text-sm">{t.label}</span>
                <Switch checked={push[t.id] !== false} onChange={() => { setPush((p) => ({ ...p, [t.id]: !(p[t.id] !== false) })); setDirty(true); }} label={t.label} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Panel>
  );
}

/* ─────────────── tiny shared UI ─────────────── */

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={cn('inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm transition-colors',
      checked ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg')}>
      <span className={cn('size-2 rounded-full', checked ? 'bg-accent' : 'bg-muted-2')} /> {label}
    </button>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      className={cn('relative h-6 w-11 shrink-0 rounded-pill transition-colors', checked ? 'bg-accent' : 'bg-surface-2 border border-border')}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow-sm', checked ? 'right-0.5' : 'left-0.5')} />
    </button>
  );
}
