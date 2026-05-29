'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Code2, Server, Palette, Users2, Megaphone, Headphones,
  Sparkles, ArrowRight, History, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Assistant } from '@/components/interview/Assistant';
import { cn } from '@/lib/utils';

type Cat = 'frontend' | 'backend' | 'design' | 'hr' | 'marketing' | 'communication';
type Level = 'intern' | 'entry' | 'mid' | 'senior' | 'staff';

const CATEGORIES: { id: Cat; label: string; desc: string; icon: React.ComponentType<{ size?: number }>; tone: string }[] = [
  { id: 'frontend',      label: 'Frontend',      desc: 'React, performance, design systems',     icon: Code2,      tone: 'oklch(72% 0.2 264)' },
  { id: 'backend',       label: 'Backend',       desc: 'APIs, scaling, system design',           icon: Server,     tone: 'oklch(78% 0.18 200)' },
  { id: 'design',        label: 'Design',        desc: 'Craft, process, critique',               icon: Palette,    tone: 'oklch(70% 0.24 340)' },
  { id: 'hr',            label: 'HR · Behavioral', desc: 'STAR stories, motivation, fit',        icon: Users2,     tone: 'oklch(85% 0.18 130)' },
  { id: 'marketing',     label: 'Marketing',     desc: 'Growth, brand, experiments',             icon: Megaphone,  tone: 'oklch(75% 0.22 50)' },
  { id: 'communication', label: 'Communication', desc: 'CS, support, empathy at scale',          icon: Headphones, tone: 'oklch(78% 0.22 142)' }
];

const LEVELS: Level[] = ['intern', 'entry', 'mid', 'senior', 'staff'];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Cat>('frontend');
  const [level, setLevel] = useState<Level>('mid');
  const [jobTitle, setJobTitle] = useState('');
  const [total, setTotal] = useState(6);
  const [starting, setStarting] = useState(false);

  const past = useQuery<any[]>({
    queryKey: ['interview-sessions'],
    queryFn: async () => (await api.get('/interview')).data.data
  });

  async function start() {
    setStarting(true);
    try {
      const r = await api.post('/interview', { category, level, jobTitle: jobTitle || undefined, totalQuestions: total });
      router.push(`/interview/${r.data.data._id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not start');
    } finally { setStarting(false); }
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="grid lg:grid-cols-[1fr_180px] gap-6 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
            <Sparkles size={11} /> AI Mock Interview
          </div>
          <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tightest">
            Train with an <span className="gradient-text italic">AI recruiter</span>.
          </h1>
          <p className="mt-3 text-muted max-w-xl">
            6 questions adapted to your skills, scored on confidence, vocabulary,
            technical depth, communication and clarity. Get a final report.
          </p>
        </div>
        <div className="justify-self-center">
          <Assistant state="idle" size={140} />
        </div>
      </header>

      {/* Category */}
      <section>
        <p className="text-eyebrow mb-3">Pick a track</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((c, i) => {
            const active = category === c.id;
            return (
              <motion.button
                key={c.id}
                onClick={() => setCategory(c.id)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'relative text-left rounded-2xl p-5 border transition-all duration-fast hover-lift',
                  active ? 'border-accent shadow-glow bg-surface-2' : 'border-border bg-bg-elev/40 hover:border-border-strong'
                )}
              >
                <div className="size-11 rounded-xl grid place-items-center mb-3 shadow-glow"
                  style={{ background: `linear-gradient(135deg, ${c.tone}, var(--accent))` }}>
                  <c.icon size={18} className="text-white" />
                </div>
                <p className="font-medium">{c.label}</p>
                <p className="text-xs text-muted mt-1">{c.desc}</p>
                {active && (
                  <motion.span layoutId="category-ring"
                    className="absolute inset-0 rounded-2xl ring-2 ring-accent pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Level + role */}
      <section className="grid sm:grid-cols-2 gap-3">
        <Card variant="glass">
          <p className="text-eyebrow mb-3">Level</p>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={cn(
                  'rounded-pill px-3 py-1 text-xs border capitalize transition',
                  level === l ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                )}>
                {l}
              </button>
            ))}
          </div>
        </Card>

        <Card variant="glass">
          <p className="text-eyebrow mb-3">Target role <span className="text-muted normal-case">(optional)</span></p>
          <Input variant="glass" size="sm" placeholder="Senior Frontend Engineer at Stripe"
            value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </Card>
      </section>

      {/* Length */}
      <section>
        <Card variant="glass" className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-eyebrow">Questions</p>
            <p className="text-sm text-muted mt-0.5">Plan for ~2–3 minutes per question.</p>
          </div>
          <div className="flex gap-1.5">
            {[3, 4, 6, 8, 10].map((n) => (
              <button key={n} onClick={() => setTotal(n)}
                className={cn(
                  'size-9 rounded-lg border text-xs tabular-nums transition',
                  total === n ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                )}>
                {n}
              </button>
            ))}
          </div>
        </Card>
      </section>

      <Button variant="accent" size="xl" magnetic className="w-full"
        loading={starting} onClick={start}>
        Start interview <ArrowRight size={16} />
      </Button>

      {/* History */}
      {past.data && past.data.length > 0 && (
        <section>
          <p className="text-eyebrow mb-3 flex items-center gap-1.5"><History size={11} /> Past sessions</p>
          <div className="space-y-2">
            {past.data.map((s: any) => (
              <Card key={s._id} variant="glass" interactive
                onClick={() => router.push(`/interview/${s._id}`)}
                className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-grad-accent grid place-items-center shrink-0">
                  <Trophy size={14} className="text-accent-fg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{s.category} · {s.level}</p>
                  <p className="text-2xs text-muted">{new Date(s.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={s.status === 'completed' ? 'success' : 'soft'} className="capitalize">
                  {s.status === 'completed' ? `${s.report?.score ?? '—'} pts` : s.status}
                </Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
