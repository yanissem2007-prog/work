'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Plus, X, Sparkles, Calendar, Building2, User } from 'lucide-react';
import { api } from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Type = 'workshop' | 'hackathon' | 'conference' | 'meetup' | 'webinar';
type HostType = 'community' | 'user';

const TYPES: Type[] = ['hackathon', 'workshop', 'conference', 'meetup', 'webinar'];

interface MyCommunity { _id: string; slug: string; name: string; accent?: string }

export default function NewEventPage() {
  const router = useRouter();
  const [hostType, setHostType] = useState<HostType>('community');
  const [hostSlug, setHostSlug] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Type>('workshop');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('');
  const [online, setOnline] = useState(true);
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [prizes, setPrizes] = useState<{ title: string; value: string }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const myCommunities = useQuery<MyCommunity[]>({
    enabled: hostType === 'community',
    queryKey: ['communities', 'mine'],
    queryFn: async () => (await api.get('/communities/mine')).data.data
  });

  function addTag(v: string) {
    const t = v.trim(); if (!t || tags.includes(t)) { setTagInput(''); return; }
    setTags([...tags, t]); setTagInput('');
  }

  async function submit() {
    if (!title.trim() || !startsAt || !endsAt) {
      toast.error('Title, start, end are required'); return;
    }
    if (hostType === 'community' && !hostSlug) {
      toast.error('Pick a community host'); return;
    }
    setBusy(true);
    try {
      const r = await api.post('/events', {
        title, type, description, banner: banner || undefined,
        hostType, hostSlug: hostType === 'community' ? hostSlug : undefined,
        online, location: location || undefined, meetingUrl: meetingUrl || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity, tags,
        prizes: prizes.filter((p) => p.title.trim())
      });
      router.push(`/events/${r.data.data.slug}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Calendar size={11} /> Host an event
        </div>
        <h1 className="mt-3 font-display text-4xl tracking-tightest">Create event</h1>
        <p className="mt-2 text-sm text-muted">Hackathons, workshops, conferences — bring your people together.</p>
      </header>

      <Card variant="glass" className="space-y-4">
        <div>
          <p className="text-eyebrow mb-2">Hosted by</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'community', label: 'A community', icon: Building2 },
              { id: 'user', label: 'You', icon: User }
            ] as const).map((h) => (
              <button key={h.id} onClick={() => setHostType(h.id)}
                className={cn(
                  'rounded-xl border p-4 text-left flex items-center gap-3 transition',
                  hostType === h.id ? 'border-accent shadow-glow bg-surface-2' : 'border-border bg-surface hover:border-border-strong'
                )}>
                <h.icon size={14} />
                <span className="text-sm">{h.label}</span>
              </button>
            ))}
          </div>
        </div>

        {hostType === 'community' && (
          <div>
            <p className="text-eyebrow mb-2">Community</p>
            <div className="flex flex-wrap gap-1.5">
              {myCommunities.data?.length === 0 && (
                <p className="text-sm text-muted">You're not an admin of any community yet.</p>
              )}
              {myCommunities.data?.map((c) => (
                <button key={c._id} onClick={() => setHostSlug(c.slug)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-pill border text-xs transition',
                    hostSlug === c.slug ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                  )}>
                  <span className="size-4 rounded grid place-items-center text-[10px] font-medium text-white"
                    style={{ background: c.accent ?? 'var(--accent)' }}>{c.name.slice(0, 1)}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card variant="glass" className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="WORK x Vercel — 48h AI Hackathon" />

        <div>
          <p className="text-eyebrow mb-2">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={cn(
                  'rounded-pill px-3 py-1 text-xs border capitalize transition',
                  type === t ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                )}>{t}</button>
            ))}
          </div>
        </div>

        <Textarea label="Description" value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the event about? Schedule? Who should attend?"
          className="min-h-40" />

        <Input label="Banner image URL (optional)" value={banner}
          onChange={(e) => setBanner(e.target.value)} placeholder="https://..." />
      </Card>

      <Card variant="glass" className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">Online event</span>
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)}
            className="accent-[var(--accent)]" />
        </label>
        {online ? (
          <Input label="Meeting URL" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet…" />
        ) : (
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="Algiers / The Block · 12 rue X" />
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Starts at" type="datetime-local" value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)} />
          <Input label="Ends at" type="datetime-local" value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)} />
        </div>

        <Input label="Capacity (0 = unlimited)" type="number"
          value={capacity || ''} onChange={(e) => setCapacity(Number(e.target.value) || 0)} />
      </Card>

      {/* Prizes (hackathons mostly) */}
      {(type === 'hackathon' || type === 'conference') && (
        <Card variant="glass">
          <p className="text-eyebrow mb-3">Prizes (optional)</p>
          {prizes.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-2 mb-2">
              <Input variant="glass" size="sm" placeholder="Title" value={p.title}
                onChange={(e) => setPrizes(prizes.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
              <Input variant="glass" size="sm" placeholder="Value" value={p.value}
                onChange={(e) => setPrizes(prizes.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
              <button onClick={() => setPrizes(prizes.filter((_, j) => j !== i))}
                className="text-muted hover:text-danger"><X size={14} /></button>
            </div>
          ))}
          <button onClick={() => setPrizes([...prizes, { title: '', value: '' }])}
            className="text-xs text-accent hover:underline inline-flex items-center gap-1">
            <Plus size={11} /> Add prize
          </button>
        </Card>
      )}

      <Card variant="glass">
        <p className="text-eyebrow mb-3">Tags</p>
        <Input variant="glass" size="sm" placeholder="Type a tag, press Enter"
          value={tagInput} onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} />
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button key={t} onClick={() => setTags(tags.filter((x) => x !== t))}
                className="text-2xs px-2 py-0.5 rounded-pill bg-accent/10 text-accent border border-accent">
                {t} ×
              </button>
            ))}
          </div>
        )}
      </Card>

      <Button variant="accent" size="xl" magnetic className="w-full"
        loading={busy} onClick={submit}>
        <Sparkles size={16} /> Publish event <ArrowRight size={16} />
      </Button>
    </div>
  );
}
