'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles, ArrowRight, Briefcase, BookOpen, User as UserIcon, Cpu, Award, History
} from 'lucide-react';
import { api } from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TiltCard, SpotlightCard, MagneticLink, LiquidButton } from '@/components/micro';
import { cn, formatRelative } from '@/lib/utils';

type Focus = 'career' | 'learning' | 'profile' | 'tech' | 'interview';

const FOCI: { id: Focus; label: string; desc: string; icon: React.ComponentType<{ size?: number }>; tone: string }[] = [
  { id: 'career',    label: 'Career improvement', desc: 'Promotion, comp, positioning',    icon: Briefcase, tone: 'oklch(72% 0.2 264)' },
  { id: 'learning',  label: 'Learning plan',      desc: 'Skill stack + cadence',           icon: BookOpen,  tone: 'oklch(78% 0.18 200)' },
  { id: 'profile',   label: 'Profile glow-up',    desc: 'CV, portfolio, signal',           icon: UserIcon,  tone: 'oklch(70% 0.24 340)' },
  { id: 'tech',      label: 'Tech choice',        desc: 'Which stack/role to bet on',      icon: Cpu,       tone: 'oklch(78% 0.22 142)' },
  { id: 'interview', label: 'Interview prep',     desc: 'Target list, mocks, stories',     icon: Award,     tone: 'oklch(75% 0.22 50)' }
];

export default function CoachHubPage() {
  const router = useRouter();
  const [focus, setFocus] = useState<Focus>('career');
  const [goal, setGoal] = useState('');
  const [horizon, setHorizon] = useState(12);
  const [busy, setBusy] = useState(false);

  const past = useQuery<any[]>({
    queryKey: ['coach-sessions'],
    queryFn: async () => (await api.get('/coach/sessions')).data.data
  });

  async function start() {
    if (goal.trim().length < 6) { toast.error('Tell me what you want'); return; }
    setBusy(true);
    try {
      const r = await api.post('/coach/sessions', { focus, goal, horizonWeeks: horizon });
      router.push(`/coach/${r.data.data._id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-8 sm:p-10"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Sparkles size={11} /> Personal AI Career Coach
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tightest max-w-2xl">
          Your edge, <span className="gradient-text italic">accelerated</span>.
        </h1>
        <p className="mt-2 text-sm text-muted max-w-xl">
          Tell me your goal. I'll build a 3–12 week plan with weekly steps, then
          check in to coach you through it.
        </p>
      </motion.section>

      {/* Focus picker */}
      <section>
        <p className="text-eyebrow mb-3">Pick a focus</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {FOCI.map((f, i) => {
            const active = focus === f.id;
            return (
              <TiltCard key={f.id} max={6}>
                <motion.button
                  onClick={() => setFocus(f.id)}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-colors w-full h-full',
                    active ? 'border-accent shadow-glow bg-surface-2' : 'border-border bg-bg-elev/40 hover:border-border-strong'
                  )}
                >
                  <div className="size-10 rounded-xl grid place-items-center shadow-glow mb-3"
                    style={{ background: `linear-gradient(135deg, ${f.tone}, var(--accent))` }}>
                    <f.icon size={14} />
                  </div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-2xs text-muted mt-0.5">{f.desc}</p>
                </motion.button>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* Goal input */}
      <SpotlightCard className="rounded-3xl border border-border bg-bg-elev/40 p-6 sm:p-8" color={FOCI.find((f) => f.id === focus)!.tone}>
        <p className="text-eyebrow mb-3">Your goal</p>
        <Textarea
          value={goal} onChange={(e) => setGoal(e.target.value)}
          placeholder='e.g. "Get a Senior Frontend role at Stripe by Q3"'
          className="min-h-24"
        />
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-muted">Horizon</span>
          <input type="range" min={2} max={26} value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="accent-[var(--accent)] flex-1" />
          <span className="text-xs font-medium tabular-nums">{horizon} weeks</span>
        </div>
        <MagneticLink>
          <LiquidButton onClick={start} className="mt-5">
            <Sparkles size={14} /> {busy ? 'Building…' : 'Build my plan'} <ArrowRight size={14} />
          </LiquidButton>
        </MagneticLink>
      </SpotlightCard>

      {/* Past sessions */}
      {past.data && past.data.length > 0 && (
        <section>
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl tracking-tighter flex items-center gap-2">
              <History size={14} /> Past sessions
            </h2>
            <span className="text-eyebrow">{past.data.length}</span>
          </header>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {past.data.map((s, i) => {
              const done = (s.plan ?? []).filter((p: any) => p.done).length;
              const total = (s.plan ?? []).length || 1;
              return (
                <Link key={s._id} href={`/coach/${s._id}`}>
                  <Card variant="glass" interactive className="hover-lift h-full">
                    <Badge variant="soft" className="capitalize">{s.focus}</Badge>
                    <p className="mt-2 font-medium text-sm line-clamp-2">{s.goal}</p>
                    <p className="mt-1 text-2xs text-muted">{formatRelative(s.updatedAt)}</p>
                    <div className="mt-3 h-1 rounded bg-surface-2 overflow-hidden">
                      <div className="h-full bg-grad-accent shadow-glow"
                        style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-2xs text-muted tabular-nums">{done}/{total} steps</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
