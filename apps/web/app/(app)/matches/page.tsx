'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, TrendingUp, Briefcase, Lightbulb } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { MatchCard, type MatchItem } from '@/components/match/MatchCard';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'remote' | 'top';

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data = [], isLoading, refetch, isFetching } = useQuery<MatchItem[]>({
    queryKey: ['matches'],
    queryFn: async () => (await api.get('/match/for-me', { params: { limit: 18 } })).data.data
  });

  const filtered = data.filter((m) => {
    if (filter === 'remote') return m.job.remote;
    if (filter === 'top') return m.match >= 80;
    return true;
  });

  // Aggregate gap analysis across results
  const gapTally = new Map<string, number>();
  data.forEach((m) => m.missingSkills.forEach((s) => gapTally.set(s, (gapTally.get(s) ?? 0) + 1)));
  const topGaps = [...gapTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const avg = data.length ? Math.round(data.reduce((s, m) => s + m.match, 0) / data.length) : 0;
  const topTier = data.filter((m) => m.match >= 80).length;

  return (
    <div className="space-y-8">
      <header className="grid lg:grid-cols-[1fr_240px] gap-6 items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
            <Sparkles size={11} /> AI Job Matching
          </div>
          <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tightest">
            Roles <span className="gradient-text italic">picked for you</span>.
          </h1>
          <p className="mt-3 text-muted max-w-xl">
            Scored on skills, experience, location, recency, and your past activity.
            Explanations powered by WORK AI.
          </p>
        </div>
        <Button variant="glass" onClick={() => refetch()} loading={isFetching}>
          <RotateCcw size={14} /> Refresh
        </Button>
      </header>

      {/* Stats strip */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={TrendingUp} label="Average match" value={`${avg}%`} tone="oklch(78% 0.18 200)" />
          <Stat icon={Sparkles} label="Top-tier matches" value={`${topTier}`} tone="oklch(78% 0.22 142)" />
          <Stat icon={Briefcase} label="Live roles ranked" value={`${data.length}`} tone="oklch(70% 0.24 340)" />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5">
        {(['all', 'top', 'remote'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'rounded-pill px-3 py-1 text-xs border capitalize transition',
              filter === f ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
            )}>
            {f === 'top' ? 'Top matches (80+)' : f}
          </button>
        ))}
      </div>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}

      {!isLoading && data.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <Briefcase size={26} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">No matches yet.</p>
          <p className="text-xs text-muted mt-1">Add skills to your profile to unlock recommendations.</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-3">
          {filtered.map((m, i) => <MatchCard key={m.jobId} item={m} index={i} />)}
        </div>

        {/* Gap analysis */}
        {topGaps.length > 0 && (
          <aside className="lg:sticky lg:top-4 h-fit space-y-3">
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-accent" />
                <p className="text-eyebrow">Skill gaps</p>
              </div>
              <p className="text-xs text-muted mb-3">
                These skills appear most often across roles you don't yet match.
                Add them to your profile or CV to unlock more matches.
              </p>
              <ul className="space-y-2">
                {topGaps.map(([skill, count], i) => (
                  <motion.li key={skill}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between gap-2">
                    <Badge variant="soft">{skill}</Badge>
                    <span className="text-2xs text-muted tabular-nums">×{count}</span>
                  </motion.li>
                ))}
              </ul>
            </Card>

            <Card variant="glass">
              <p className="text-eyebrow mb-2">Quick wins</p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex gap-2"><span className="size-1.5 rounded-full bg-accent mt-1.5 shadow-glow shrink-0" /> Add 3 quantified bullets to your CV.</li>
                <li className="flex gap-2"><span className="size-1.5 rounded-full bg-accent mt-1.5 shadow-glow shrink-0" /> Set "open to work" on your profile.</li>
                <li className="flex gap-2"><span className="size-1.5 rounded-full bg-accent mt-1.5 shadow-glow shrink-0" /> Apply to your top 3 matches today.</li>
              </ul>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }:
  { icon: React.ComponentType<{ size?: number }>; label: string; value: string; tone: string }) {
  return (
    <Card variant="glass" className="flex items-center gap-3">
      <div className="size-9 rounded-xl grid place-items-center shadow-glow"
        style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-2xs uppercase tracking-caps text-muted">{label}</p>
        <p className="font-display tracking-tighter tabular-nums" style={{ color: tone }}>{value}</p>
      </div>
    </Card>
  );
}
