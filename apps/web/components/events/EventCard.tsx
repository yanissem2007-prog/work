'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users2, MapPin, Globe2, Calendar, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

export interface EventCardData {
  _id: string;
  slug: string;
  title: string;
  type: string;
  banner?: string;
  accent?: string;
  online: boolean;
  location?: string;
  startsAt: string;
  endsAt: string;
  counts: { going: number; maybe: number; waitlist: number };
  capacity?: number;
  hostType: string;
  host?: { name?: string; slug?: string; icon?: string; accent?: string; universityName?: string };
  tags?: string[];
}

const TYPE_TONE: Record<string, string> = {
  workshop: 'oklch(78% 0.18 200)',
  hackathon: 'oklch(70% 0.24 340)',
  conference: 'oklch(72% 0.2 264)',
  meetup: 'oklch(78% 0.22 142)',
  webinar: 'oklch(75% 0.22 50)'
};

export function EventCard({ event, index = 0 }: { event: EventCardData; index?: number }) {
  const tone = TYPE_TONE[event.type] ?? 'var(--accent)';
  const c = useCountdown(event.startsAt, event.endsAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/events/${event.slug}`}
        className="group block rounded-3xl overflow-hidden border border-border bg-bg-elev/60 hover:border-border-strong hover:shadow-glow transition">
        <div className="relative aspect-[16/9] overflow-hidden">
          {event.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.banner} alt={event.title}
              className="size-full object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="size-full"
              style={{ background: `linear-gradient(135deg, ${event.accent ?? tone}, var(--accent))` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Type + live state */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <Badge variant="soft" className="capitalize backdrop-blur" dot dotColor={tone}>{event.type}</Badge>
            {c.status === 'live' && (
              <Badge variant="accent" dot>
                <span className="size-1.5 rounded-full bg-white animate-pulse" /> Live
              </Badge>
            )}
          </div>

          {/* Bottom info overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-white/80 text-2xs flex items-center gap-1.5">
              <Calendar size={11} />
              {new Date(event.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            <p className="mt-1 font-display text-lg tracking-tight text-white leading-tight line-clamp-2">
              {event.title}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {c.status === 'upcoming' && (
            <div className="flex items-center gap-1.5">
              {[
                { l: 'd', v: c.days },
                { l: 'h', v: c.hours },
                { l: 'm', v: c.minutes },
                { l: 's', v: c.seconds }
              ].map((x) => (
                <span key={x.l} className="text-2xs px-1.5 py-0.5 rounded bg-surface-2 tabular-nums font-medium">
                  {String(x.v).padStart(2, '0')}{x.l}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-2xs text-muted">
            <span className="flex items-center gap-1">
              {event.online ? <><Globe2 size={11} /> Online</> : <><MapPin size={11} /> {event.location ?? '—'}</>}
            </span>
            <span className="flex items-center gap-1">
              <Users2 size={11} /> {event.counts.going.toLocaleString()}
              {event.capacity ? ` / ${event.capacity.toLocaleString()}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {event.host?.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.host.icon} alt="" className="size-6 rounded" />
            ) : (
              <div className="size-6 rounded grid place-items-center text-2xs font-medium"
                style={{ background: event.host?.accent ?? 'var(--surface-2)' }}>
                {(event.host?.name ?? '?').slice(0, 1)}
              </div>
            )}
            <span className="text-xs text-muted truncate">
              {event.host?.name ?? event.host?.universityName ?? 'Host'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
