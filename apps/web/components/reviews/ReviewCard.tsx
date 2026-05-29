'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Flag, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Stars } from '@/components/freelance/Stars';
import { api } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';

interface Review {
  _id: string; rating: number;
  breakdown: { culture: number; comp: number; worklife: number; management: number; growth: number };
  title: string; pros?: string; cons?: string; advice?: string;
  recommend: boolean;
  employmentStatus: string;
  tenureYears?: number; role?: string; location?: string;
  anonymous: boolean;
  helpfulCount: number;
  createdAt: string;
  author?: { handle?: string; name?: string; avatar?: string; headline?: string };
}

export function ReviewCard({ review, slug }: { review: Review; slug: string }) {
  const [helpful, setHelpful] = useState(review.helpfulCount);
  const [voted, setVoted] = useState(false);

  async function toggleHelpful() {
    const r = await api.post(`/companies/${slug}/reviews/${review._id}/helpful`);
    setHelpful(r.data.data.helpfulCount);
    setVoted(r.data.data.helpful);
  }
  async function flag() {
    await api.post(`/companies/${slug}/reviews/${review._id}/flag`);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-5"
    >
      <header className="flex items-center gap-3 mb-3">
        {review.anonymous ? (
          <div className="size-9 rounded-full bg-surface-2 grid place-items-center text-muted">
            <EyeOff size={14} />
          </div>
        ) : (
          <Avatar src={review.author?.avatar} name={review.author?.name ?? '—'} ring />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {review.anonymous ? 'Anonymous reviewer' : review.author?.name}
            <span className="text-2xs text-muted ml-2 capitalize">· {review.employmentStatus}</span>
          </p>
          <p className="text-2xs text-muted">
            {review.role ?? '—'}
            {review.tenureYears ? ` · ${review.tenureYears}y tenure` : ''}
            {review.location ? ` · ${review.location}` : ''}
            <span> · {formatRelative(review.createdAt)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <Stars value={review.rating} size={14} />
          <Badge
            variant={review.recommend ? 'success' : 'soft'}
            dot dotColor={review.recommend ? 'oklch(78% 0.22 142)' : 'oklch(70% 0.22 25)'}
            className="mt-1 text-2xs"
          >
            {review.recommend
              ? <><CheckCircle2 size={10} /> Recommends</>
              : <><XCircle size={10} /> Doesn't recommend</>
            }
          </Badge>
        </div>
      </header>

      <h3 className="font-display text-lg tracking-tight leading-snug">"{review.title}"</h3>

      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        {review.pros && (
          <Section title="Pros" tone="oklch(78% 0.22 142)" text={review.pros} />
        )}
        {review.cons && (
          <Section title="Cons" tone="oklch(70% 0.22 25)" text={review.cons} />
        )}
        {review.advice && (
          <Section title="Advice to management" tone="oklch(72% 0.2 264)" text={review.advice} className="sm:col-span-2" />
        )}
      </div>

      {/* Breakdown chips */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Object.entries(review.breakdown).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-surface p-1.5 text-center">
            <p className="font-display text-sm tabular-nums" style={{ color: v >= 4 ? 'oklch(78% 0.22 142)' : v >= 3 ? 'oklch(78% 0.18 200)' : 'oklch(78% 0.18 70)' }}>{v}</p>
            <p className="text-[10px] uppercase tracking-caps text-muted truncate">{k}</p>
          </div>
        ))}
      </div>

      <footer className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
        <button onClick={toggleHelpful}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs transition',
            voted ? 'bg-accent/10 text-accent' : 'text-muted hover:text-fg hover:bg-surface'
          )}>
          <ThumbsUp size={12} className={cn(voted && 'fill-current')} /> Helpful · {helpful}
        </button>
        <button onClick={flag}
          className="ml-auto text-2xs text-muted hover:text-danger inline-flex items-center gap-1">
          <Flag size={11} /> Flag
        </button>
      </footer>
    </motion.article>
  );
}

function Section({ title, tone, text, className }:
  { title: string; tone: string; text: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-3', className)}>
      <p className="text-2xs uppercase tracking-caps font-medium mb-1" style={{ color: tone }}>{title}</p>
      <p className="text-sm text-fg-soft whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}
