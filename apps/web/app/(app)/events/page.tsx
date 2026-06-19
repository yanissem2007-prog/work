'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Plus, Sparkles, GraduationCap, Code2, Users2, Mic, Briefcase } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EventCard, type EventCardData } from '@/components/events/EventCard';
import { cn } from '@/lib/utils';

type Type = 'workshop' | 'hackathon' | 'conference' | 'meetup' | 'webinar';
type Scope = 'upcoming' | 'live' | 'past';

const TYPES: { id: Type; label: string; icon: LucideIcon; tone: string }[] = [
  { id: 'hackathon',  label: 'Hackathons',  icon: Code2,     tone: 'oklch(70% 0.24 340)' },
  { id: 'workshop',   label: 'Workshops',   icon: Sparkles,  tone: 'oklch(78% 0.18 200)' },
  { id: 'conference', label: 'Conferences', icon: Briefcase, tone: 'oklch(72% 0.2 264)' },
  { id: 'meetup',     label: 'Meetups',     icon: Users2,    tone: 'oklch(78% 0.22 142)' },
  { id: 'webinar',    label: 'Webinars',    icon: Mic,       tone: 'oklch(75% 0.22 50)' }
];

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live',     label: 'Live now' },
  { id: 'past',     label: 'Past' }
];

export default function EventsPage() {
  const [scope, setScope] = useState<Scope>('upcoming');
  const [types, setTypes] = useState<Type[]>([]);

  const { data: events = [], isLoading } = useQuery<EventCardData[]>({
    queryKey: ['events', scope, types],
    queryFn: async () =>
      (await api.get('/events', { params: { scope, type: types.join(',') || undefined } })).data.data
  });

  const mine = useQuery<EventCardData[]>({
    queryKey: ['events', 'mine'],
    queryFn: async () => (await api.get('/events/mine')).data.data
  });

  function toggleType(t: Type) {
    setTypes((arr) => arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-8 sm:p-12"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Calendar size={11} /> Events & Hackathons
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tightest max-w-2xl">
          Where careers <span className="gradient-text italic">happen live</span>.
        </h1>
        <p className="mt-3 text-muted max-w-xl">
          Hackathons, workshops, conferences and meetups hosted by communities and universities.
          RSVP in a click, get reminders, never miss a thing.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/events/new">
            <Button variant="accent" size="lg" magnetic><Plus size={14} /> Host an event</Button>
          </Link>
        </div>
      </motion.section>

      {/* My events strip */}
      {mine.data && mine.data.length > 0 && (
        <section>
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl tracking-tighter">Your events</h2>
            <span className="text-eyebrow">{mine.data.length} upcoming</span>
          </header>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.data.slice(0, 3).map((e, i) => <EventCard key={e._id} event={e} index={i} />)}
          </div>
        </section>
      )}

      {/* Type chips */}
      <section>
        <p className="text-eyebrow mb-3">Browse</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TYPES.map((t, i) => {
            const active = types.includes(t.id);
            return (
              <motion.button key={t.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => toggleType(t.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition hover-lift',
                  active ? 'border-accent shadow-glow bg-surface-2' : 'border-border bg-bg-elev/40 hover:border-border-strong'
                )}>
                <div className="size-9 rounded-xl grid place-items-center mb-2 shadow-glow"
                  style={{ background: `linear-gradient(135deg, ${t.tone}, var(--accent))` }}>
                  <t.icon size={14} />
                </div>
                <p className="text-sm font-medium">{t.label}</p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Scope tabs */}
      <div className="flex gap-1.5">
        {SCOPES.map((s) => (
          <button key={s.id} onClick={() => setScope(s.id)}
            className={cn(
              'rounded-pill px-3 py-1 text-xs border transition',
              scope === s.id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!isLoading && events.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <Calendar size={26} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">Nothing here yet.</p>
          <p className="text-xs text-muted mt-1">Try a different scope or be the first to host.</p>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e, i) => <EventCard key={e._id} event={e} index={i} />)}
      </div>
    </div>
  );
}
