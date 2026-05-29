'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Zap, Heart } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface GigCardData {
  _id: string;
  slug: string;
  title: string;
  cover?: string;
  priceFrom: number;
  deliveryFastest: number;
  category: string;
  rating: { avg: number; count: number };
  stats?: { orders?: number };
  seller?: { handle?: string; name?: string; avatar?: string; headline?: string };
}

const CAT_TONE: Record<string, string> = {
  design: 'oklch(70% 0.24 340)',
  development: 'oklch(72% 0.2 264)',
  editing: 'oklch(78% 0.18 200)',
  writing: 'oklch(75% 0.22 50)',
  marketing: 'oklch(78% 0.22 142)'
};

export function GigCard({ gig, index = 0 }: { gig: GigCardData; index?: number }) {
  const tone = CAT_TONE[gig.category] ?? 'var(--accent)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/freelance/gig/${gig.slug}`}
        className="group block rounded-2xl border border-border bg-bg-elev/60 overflow-hidden hover:border-border-strong hover:shadow-glow transition">
        <div className="relative aspect-[16/10] overflow-hidden">
          {gig.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gig.cover} alt={gig.title}
              className="size-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="size-full"
              style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <Badge variant="soft" className="capitalize backdrop-blur">{gig.category}</Badge>
            {gig.deliveryFastest <= 3 && (
              <Badge variant="accent" dot><Zap size={9} /> {gig.deliveryFastest}d</Badge>
            )}
          </div>
          <button aria-label="Save"
            onClick={(e) => { e.preventDefault(); }}
            className="absolute top-3 right-3 size-8 rounded-full bg-black/50 text-white grid place-items-center backdrop-blur hover:bg-black/70 transition">
            <Heart size={13} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Avatar src={gig.seller?.avatar} name={gig.seller?.name ?? '—'} size="xs" />
            <p className="text-xs text-muted truncate">{gig.seller?.name}</p>
          </div>
          <p className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {gig.title}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-current text-warning" />
              <span className="text-xs font-medium tabular-nums">{gig.rating.avg.toFixed(1)}</span>
              <span className="text-2xs text-muted">({gig.rating.count})</span>
            </div>
            <p className="text-sm font-display tracking-tighter">
              <span className="text-2xs text-muted">From </span>
              <span className="tabular-nums">${gig.priceFrom}</span>
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
