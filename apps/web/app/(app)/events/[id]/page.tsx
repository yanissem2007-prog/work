'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Globe2, Calendar, Trophy, Users2, Megaphone, Pin, Sparkles,
  CheckCircle2, Clock, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { CountdownDisplay } from '@/components/events/CountdownDisplay';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuthStore } from '@/stores/authStore';
import { formatRelative, cn } from '@/lib/utils';

interface Event {
  _id: string; slug: string; title: string; type: string; description?: string;
  banner?: string; accent?: string;
  hostType: 'community' | 'university' | 'user';
  online: boolean; location?: string; meetingUrl?: string;
  startsAt: string; endsAt: string;
  capacity?: number;
  tags?: string[];
  speakers?: { name: string; title?: string; avatar?: string }[];
  prizes?: { rank?: number; title: string; value?: string; description?: string }[];
  sponsors?: { name: string; logo?: string; url?: string }[];
  rules?: string[];
  counts: { going: number; maybe: number; waitlist: number };
  status: string;
  host?: { name?: string; slug?: string; icon?: string; accent?: string; universityName?: string; handle?: string };
  viewer?: { rsvp?: { status: 'going' | 'maybe' | 'waitlist' | 'cancelled'; role?: string } };
  createdBy: string;
}

interface Attendee {
  _id: string; status: string; role: string;
  user?: { handle?: string; name?: string; avatar?: string; headline?: string };
}

interface Announcement {
  _id: string; content: string; pinned: boolean; createdAt: string;
  author?: { name?: string; avatar?: string };
}

export default function EventDetailPage() {
  const { id } = useParams();
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: async () => (await api.get(`/events/${id}`)).data.data
  });

  const attendees = useQuery<Attendee[]>({
    enabled: !!event,
    queryKey: ['event', id, 'attendees'],
    queryFn: async () => (await api.get(`/events/${id}/attendees`)).data.data
  });

  const announcements = useQuery<Announcement[]>({
    enabled: !!event,
    queryKey: ['event', id, 'announcements'],
    queryFn: async () => (await api.get(`/events/${id}/announcements`)).data.data
  });

  const c = useCountdown(event?.startsAt, event?.endsAt);

  const rsvp = useMutation({
    mutationFn: async (status: 'going' | 'maybe') =>
      (await api.post(`/events/${event!._id}/rsvp`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['event', id, 'attendees'] });
      toast.success('RSVP saved');
    }
  });

  const cancelRsvp = useMutation({
    mutationFn: async () => (await api.delete(`/events/${event!._id}/rsvp`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['event', id, 'attendees'] });
    }
  });

  if (isLoading || !event) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const isOrganizer = me?.id === event.createdBy;
  const myStatus = event.viewer?.rsvp?.status;

  return (
    <div className="space-y-8">
      <Link href="/events" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> All events
      </Link>

      {/* Hero banner */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden glass-strong"
      >
        <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden">
          {event.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.banner} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full" style={{ background: `linear-gradient(135deg, ${event.accent ?? 'var(--accent)'}, oklch(70% 0.24 340))` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-elev via-bg-elev/40 to-transparent" />
        </div>

        <div className="px-6 sm:px-8 pb-7 -mt-16 relative">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="soft" className="capitalize backdrop-blur">{event.type}</Badge>
            {c.status === 'live' && (
              <Badge variant="accent" dot>
                <span className="size-1.5 rounded-full bg-white animate-pulse" /> Live now
              </Badge>
            )}
            {event.status === 'cancelled' && <Badge variant="danger">Cancelled</Badge>}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tightest leading-tight max-w-3xl">
            {event.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 flex-wrap text-sm text-fg-soft">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(event.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span className="flex items-center gap-1.5">
              {event.online ? <><Globe2 size={13} /> Online</> : <><MapPin size={13} /> {event.location ?? '—'}</>}
            </span>
            <span className="flex items-center gap-1.5"><Users2 size={13} /> {event.counts.going} going{event.capacity ? ` / ${event.capacity}` : ''}</span>
          </div>
        </div>
      </motion.section>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <main className="space-y-6">
          {/* Countdown banner */}
          {c.status !== 'past' && (
            <Card variant="glass" className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-eyebrow flex items-center gap-1.5">
                  <Clock size={11} /> {c.status === 'live' ? 'Wraps in' : 'Starts in'}
                </p>
                <CountdownDisplay startsAt={event.startsAt} endsAt={event.endsAt} size="md" />
              </div>
              {c.status === 'live' && event.meetingUrl && (
                <a href={event.meetingUrl} target="_blank" rel="noopener">
                  <Button variant="accent" size="lg" magnetic>Join now</Button>
                </a>
              )}
            </Card>
          )}

          {event.description && (
            <Card variant="glass">
              <h2 className="font-display text-xl tracking-tighter mb-2">About</h2>
              <p className="text-sm text-fg-soft whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </Card>
          )}

          {event.prizes && event.prizes.length > 0 && (
            <Card variant="glass">
              <h2 className="font-display text-xl tracking-tighter mb-3 flex items-center gap-2">
                <Trophy size={16} className="text-warning" /> Prizes
              </h2>
              <ul className="space-y-2.5">
                {event.prizes.map((p, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="size-8 rounded-lg bg-grad-accent shadow-glow grid place-items-center shrink-0">
                      <span className="text-xs font-display tracking-tighter">{p.rank ?? i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.title} {p.value && <span className="text-accent">· {p.value}</span>}</p>
                      {p.description && <p className="text-xs text-muted mt-0.5">{p.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {event.speakers && event.speakers.length > 0 && (
            <Card variant="glass">
              <h2 className="font-display text-xl tracking-tighter mb-3">Speakers</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {event.speakers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar src={s.avatar} name={s.name} ring />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.title && <p className="text-2xs text-muted">{s.title}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {event.rules && event.rules.length > 0 && (
            <Card variant="glass">
              <h2 className="font-display text-xl tracking-tighter mb-3 flex items-center gap-2">
                <ShieldCheck size={14} /> Rules
              </h2>
              <ul className="space-y-1.5 text-sm">
                {event.rules.map((r, i) => (
                  <li key={i} className="flex gap-2"><span className="text-accent">·</span> {r}</li>
                ))}
              </ul>
            </Card>
          )}

          {event.sponsors && event.sponsors.length > 0 && (
            <Card variant="glass">
              <p className="text-eyebrow mb-3">Sponsors</p>
              <div className="flex flex-wrap gap-3 items-center">
                {event.sponsors.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener"
                    className="opacity-70 hover:opacity-100 transition">
                    {s.logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={s.logo} alt={s.name} className="h-8" />
                      : <span className="text-sm">{s.name}</span>}
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Announcements */}
          <Announcements eventId={event._id} canPost={isOrganizer} announcements={announcements.data ?? []}
            onRefetch={() => announcements.refetch()} />
        </main>

        {/* Right rail */}
        <aside className="space-y-3 lg:sticky lg:top-4 h-fit">
          {/* RSVP card */}
          <Card variant="glass">
            <p className="text-eyebrow mb-2">RSVP</p>
            {event.status === 'cancelled' ? (
              <p className="text-sm text-muted">This event was cancelled.</p>
            ) : myStatus && myStatus !== 'cancelled' ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} className="text-success" />
                  <p className="text-sm font-medium capitalize">{myStatus === 'waitlist' ? 'On waitlist' : `You're ${myStatus}`}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="glass" className="flex-1"
                    onClick={() => rsvp.mutate(myStatus === 'going' ? 'maybe' : 'going')}>
                    Change to {myStatus === 'going' ? 'maybe' : 'going'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cancelRsvp.mutate()}>Cancel</Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="accent" magnetic className="flex-1" loading={rsvp.isPending}
                  onClick={() => rsvp.mutate('going')}>
                  <Sparkles size={13} /> I'm going
                </Button>
                <Button variant="glass" onClick={() => rsvp.mutate('maybe')}>Maybe</Button>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Going', value: event.counts.going },
                { label: 'Maybe', value: event.counts.maybe },
                { label: 'Wait', value: event.counts.waitlist }
              ].map((x) => (
                <div key={x.label} className="rounded-lg bg-surface p-2">
                  <p className="font-display tracking-tighter tabular-nums">{x.value}</p>
                  <p className="text-[10px] uppercase tracking-caps text-muted">{x.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Host card */}
          <Card variant="glass">
            <p className="text-eyebrow mb-2">Hosted by</p>
            <Link href={event.hostType === 'community' ? `/communities/${event.host?.slug}` : `/profile/${event.host?.handle}`}
              className="flex items-center gap-3 hover:opacity-90 transition">
              <div className="size-10 rounded-xl grid place-items-center font-medium text-white"
                style={{ background: event.host?.accent ?? 'var(--accent)' }}>
                {(event.host?.name ?? '?').slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-medium">{event.host?.name ?? event.host?.universityName}</p>
                <p className="text-2xs text-muted capitalize">{event.hostType}</p>
              </div>
            </Link>
          </Card>

          {/* Attendees preview */}
          <Card variant="glass">
            <p className="text-eyebrow mb-3">{attendees.data?.length ?? 0} attending</p>
            <div className="flex flex-wrap gap-1.5">
              {attendees.data?.slice(0, 18).map((a) => (
                <Link key={a._id} href={`/profile/${a.user?.handle}`}>
                  <Avatar src={a.user?.avatar} name={a.user?.name ?? '—'} size="sm"
                    ring={a.role !== 'attendee'} />
                </Link>
              ))}
              {(attendees.data?.length ?? 0) > 18 && (
                <span className="text-2xs text-muted self-center ml-2">+{(attendees.data?.length ?? 0) - 18}</span>
              )}
            </div>
          </Card>

          {isOrganizer && (
            <Card variant="glass">
              <p className="text-eyebrow mb-2">Organizer tools</p>
              <p className="text-2xs text-muted mb-3">You're managing this event.</p>
              <div className="flex flex-col gap-2">
                <Link href={`/events/${event.slug}/edit`}>
                  <Button variant="glass" size="sm" className="w-full">Edit event</Button>
                </Link>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Announcements({ eventId, canPost, announcements, onRefetch }:
  { eventId: string; canPost: boolean; announcements: Announcement[]; onRefetch: () => void }) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api.post(`/events/${eventId}/announcements`, { content: draft });
      setDraft(''); onRefetch();
      toast.success('Announcement posted');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <Card variant="glass">
      <h2 className="font-display text-xl tracking-tighter mb-3 flex items-center gap-2">
        <Megaphone size={14} className="text-accent" /> Announcements
      </h2>

      {canPost && (
        <div className="mb-4 space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="Share an update with all attendees…" className="min-h-20" />
          <div className="flex justify-end">
            <Button size="sm" variant="accent" loading={busy} disabled={!draft.trim()} onClick={publish}>
              Publish to {announcements.length === 0 ? 'all attendees' : 'feed'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 && (
          <p className="text-sm text-muted">No announcements yet.</p>
        )}
        <AnimatePresence>
          {announcements.map((a, i) => (
            <motion.div key={a._id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn('rounded-xl p-3 border', a.pinned ? 'border-accent bg-accent/5' : 'border-border bg-surface')}
            >
              <div className="flex items-center gap-2 mb-1">
                <Avatar src={a.author?.avatar} name={a.author?.name ?? '—'} size="xs" />
                <p className="text-xs font-medium">{a.author?.name}</p>
                <span className="text-2xs text-muted">· {formatRelative(a.createdAt)}</span>
                {a.pinned && <Pin size={11} className="text-accent ml-auto" />}
              </div>
              <p className="text-sm whitespace-pre-wrap">{a.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
