'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, Map, Compass, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatRelative } from '@/lib/utils';

type Level = 'beginner' | 'intermediate' | 'advanced';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

const PROMPTS = [
  'I want to become a Full Stack Developer',
  'I want to become a Senior Product Designer',
  'I want to become an ML Engineer',
  'I want to become a Founding Engineer',
  'I want to break into DevRel'
];

export default function RoadmapHubPage() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [hours, setHours] = useState(10);
  const [busy, setBusy] = useState(false);

  const past = useQuery<{ _id: string; title?: string; goal: string; level: string; progress: { stepsTotal: number; stepsDone: number }; createdAt: string }[]>({
    queryKey: ['roadmaps'],
    queryFn: async () => (await api.get('/roadmap')).data.data
  });

  async function generate() {
    const text = goal.trim(); if (text.length < 6) { toast.error('Tell me what you want to become'); return; }
    setBusy(true);
    try {
      const r = await api.post('/roadmap/generate', { goal: text, level, hoursPerWeek: hours });
      router.push(`/roadmap/${r.data.data._id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
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
          <Map size={11} /> AI Roadmap Generator
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tightest max-w-2xl">
          Tell me where you want to go.
          <br />
          <span className="gradient-text italic">I'll plot the route.</span>
        </h1>
        <p className="mt-3 text-muted max-w-xl">
          Get a phased roadmap with measurable steps, projects, and resources — tailored to your level and time.
        </p>

        <div className="mt-6 max-w-2xl space-y-3">
          <Input variant="glass" size="lg"
            placeholder="I want to become a Full Stack Developer"
            value={goal} onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') generate(); }} />

          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => setGoal(p)}
                className="text-2xs rounded-pill px-3 py-1 border border-border bg-surface hover:border-border-strong text-muted hover:text-fg transition">
                {p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={cn(
                    'rounded-pill px-3 py-1 text-xs border capitalize transition',
                    level === l ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                  )}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Hours / week</span>
              <input type="range" min={2} max={40} step={1} value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="accent-[var(--accent)]" />
              <span className="tabular-nums font-medium text-fg">{hours}h</span>
            </div>
          </div>

          <Button variant="accent" size="xl" magnetic className="w-full"
            loading={busy} onClick={generate} disabled={goal.trim().length < 6}>
            <Sparkles size={16} /> Generate roadmap <ArrowRight size={16} />
          </Button>
        </div>
      </motion.section>

      {/* Past roadmaps */}
      {past.data && past.data.length > 0 && (
        <section>
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl tracking-tighter">Your roadmaps</h2>
            <span className="text-eyebrow">{past.data.length} saved</span>
          </header>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {past.data.map((r, i) => (
              <Link key={r._id} href={`/roadmap/${r._id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Card variant="glass" interactive className="h-full">
                    <div className="size-10 rounded-xl bg-grad-accent shadow-glow grid place-items-center mb-3">
                      <Compass size={14} className="text-accent-fg" />
                    </div>
                    <p className="font-medium text-sm leading-tight line-clamp-2">
                      {r.title ?? r.goal}
                    </p>
                    <p className="mt-1 text-2xs text-muted capitalize">
                      {r.level} · {formatRelative(r.createdAt)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded bg-surface-2 overflow-hidden">
                        <div
                          className="h-full bg-grad-accent shadow-glow"
                          style={{ width: `${r.progress.stepsTotal ? (r.progress.stepsDone / r.progress.stepsTotal) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-2xs text-muted tabular-nums">
                        {r.progress.stepsDone}/{r.progress.stepsTotal}
                      </span>
                    </div>
                    {r.progress.stepsTotal > 0 && r.progress.stepsDone === r.progress.stepsTotal && (
                      <div className="mt-2 flex items-center gap-1 text-2xs text-success">
                        <Trophy size={11} /> Complete
                      </div>
                    )}
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
