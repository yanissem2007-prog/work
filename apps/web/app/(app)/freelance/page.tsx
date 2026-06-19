'use client';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Plus, Palette, Code2, Scissors, PenLine, Megaphone, Sparkles, LayoutDashboard, ShoppingBag
} from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { GigCard, type GigCardData } from '@/components/freelance/GigCard';
import { cn } from '@/lib/utils';

type Cat = 'design' | 'development' | 'editing' | 'writing' | 'marketing';

const CATEGORIES: { id: Cat; label: string; icon: LucideIcon; tone: string }[] = [
  { id: 'design',      label: 'Design',       icon: Palette,   tone: 'oklch(70% 0.24 340)' },
  { id: 'development', label: 'Development',  icon: Code2,     tone: 'oklch(72% 0.2 264)' },
  { id: 'editing',     label: 'Editing',      icon: Scissors,  tone: 'oklch(78% 0.18 200)' },
  { id: 'writing',     label: 'Writing',      icon: PenLine,   tone: 'oklch(75% 0.22 50)' },
  { id: 'marketing',   label: 'Marketing',    icon: Megaphone, tone: 'oklch(78% 0.22 142)' }
];

const SORTS = [
  { id: 'relevance', label: 'Best match' },
  { id: 'rating',    label: 'Top rated' },
  { id: 'price',     label: 'Lowest price' },
  { id: 'delivery',  label: 'Fastest' }
] as const;

export default function FreelancePage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<Cat | null>(null);
  const [sort, setSort] = useState<typeof SORTS[number]['id']>('relevance');

  const params = useMemo(() => ({
    q: q || undefined,
    category: category ?? undefined,
    sort: sort === 'relevance' ? undefined : sort
  }), [q, category, sort]);

  const { data: gigs = [], isLoading } = useQuery<GigCardData[]>({
    queryKey: ['gigs', params],
    queryFn: async () => (await api.get('/freelance/gigs', { params })).data.data
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-8 sm:p-12"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <ShoppingBag size={11} /> Freelance marketplace
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tightest max-w-2xl">
          Hire <span className="gradient-text italic">talent</span> · sell your skills.
        </h1>
        <p className="mt-3 text-muted max-w-xl">
          Verified student freelancers. Premium design, code, editing, writing and marketing.
          Pay only when you're happy.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[260px] max-w-xl">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              variant="glass" size="lg" placeholder="What are you looking to get done?"
              className="pl-10"
              value={q} onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Link href="/freelance/new">
            <Button variant="accent" size="lg" magnetic><Plus size={14} /> Become a seller</Button>
          </Link>
          <Link href="/freelance/dashboard">
            <Button variant="glass" size="lg"><LayoutDashboard size={14} /> Dashboard</Button>
          </Link>
        </div>
      </motion.section>

      {/* Category chips */}
      <section>
        <p className="text-eyebrow mb-3">Categories</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              'rounded-2xl border p-4 text-left transition hover-lift',
              category === null ? 'border-accent shadow-glow bg-surface-2' : 'border-border bg-bg-elev/40 hover:border-border-strong'
            )}
          >
            <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center mb-2">
              <Sparkles size={14} className="text-accent-fg" />
            </div>
            <p className="text-sm font-medium">All</p>
          </button>
          {CATEGORIES.map((c, i) => {
            const active = category === c.id;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setCategory(active ? null : c.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition hover-lift',
                  active ? 'border-accent shadow-glow bg-surface-2' : 'border-border bg-bg-elev/40 hover:border-border-strong'
                )}
              >
                <div className="size-9 rounded-xl grid place-items-center mb-2 shadow-glow"
                  style={{ background: `linear-gradient(135deg, ${c.tone}, var(--accent))` }}>
                  <c.icon size={14} className="text-white" />
                </div>
                <p className="text-sm font-medium">{c.label}</p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Sort */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-eyebrow mr-1">Sort</span>
        {SORTS.map((s) => (
          <button key={s.id} onClick={() => setSort(s.id)}
            className={cn(
              'rounded-pill px-3 py-1 text-xs border transition',
              sort === s.id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Gigs grid */}
      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!isLoading && gigs.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <ShoppingBag size={26} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">No services here yet.</p>
          <p className="text-xs text-muted mt-1">Try a different category — or be the first to offer one.</p>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gigs.map((g, i) => <GigCard key={g._id} gig={g} index={i} />)}
      </div>
    </div>
  );
}
