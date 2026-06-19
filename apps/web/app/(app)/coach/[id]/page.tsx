'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Check, Sparkles, Smile, Meh, Frown, MessageCircleHeart } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input, Textarea } from '@/components/ui/Input';
import { AnimatedNumber } from '@/components/micro';
import { cn, formatRelative } from '@/lib/utils';

interface Step { id: string; title: string; action?: string; due: string; done: boolean }
interface CheckIn { at: string; mood: 'stuck' | 'okay' | 'great'; win?: string; block?: string; next?: string; insight?: string }
interface Session {
  _id: string; focus: string; goal: string; summary?: string;
  horizonWeeks: number;
  plan: Step[];
  insights: string[];
  checkIns: CheckIn[];
}

export default function CoachSessionPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ['coach-session', id],
    queryFn: async () => (await api.get(`/coach/sessions/${id}`)).data.data
  });

  const toggle = useMutation({
    mutationFn: async ({ stepId, done }: { stepId: string; done: boolean }) =>
      api.patch(`/coach/sessions/${id}/plan/${stepId}`, { done }),
    onMutate: async ({ stepId, done }) => {
      qc.setQueryData<Session>(['coach-session', id], (old) => {
        if (!old) return old;
        return { ...old, plan: old.plan.map((s) => s.id === stepId ? { ...s, done } : s) };
      });
    }
  });

  if (isLoading || !session) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const done = session.plan.filter((s) => s.done).length;
  const total = session.plan.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link href="/coach" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> All sessions
      </Link>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-6 sm:p-8"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-40" />
        <div className="absolute inset-0 -z-10 noise opacity-30" />
        <Badge variant="soft" dot dotColor="var(--accent)" className="capitalize">{session.focus} coach</Badge>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl tracking-tightest leading-tight">
          {session.goal}
        </h1>
        {session.summary && <p className="mt-3 text-sm text-muted max-w-2xl">{session.summary}</p>}

        <div className="mt-5 grid sm:grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5 text-2xs text-muted">
              <span>Progress</span>
              <span className="tabular-nums">
                <AnimatedNumber value={done} className="font-medium text-fg" /> / {total} · {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full origin-left bg-grad-accent shadow-glow"
              />
            </div>
          </div>
          <Badge variant="accent" dot>{session.horizonWeeks} weeks</Badge>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Plan */}
        <section className="space-y-3">
          <h2 className="font-display text-xl tracking-tighter">Plan</h2>
          {session.plan.map((step, i) => (
            <motion.button
              key={step.id}
              initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle.mutate({ stepId: step.id, done: !step.done })}
              className={cn(
                'w-full text-left glass rounded-2xl p-4 transition-colors flex items-start gap-3',
                step.done && 'opacity-70'
              )}
            >
              <span className={cn(
                'mt-0.5 size-6 rounded-full grid place-items-center transition shrink-0',
                step.done
                  ? 'bg-grad-accent text-accent-fg shadow-glow'
                  : 'border border-border text-muted'
              )}>
                {step.done && <Check size={12} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', step.done && 'line-through')}>{step.title}</p>
                {step.action && <p className="mt-0.5 text-xs text-muted">{step.action}</p>}
                <p className="mt-1 text-2xs text-muted">Due {formatRelative(step.due)}</p>
              </div>
            </motion.button>
          ))}
        </section>

        {/* Right rail */}
        <aside className="space-y-3">
          <Card variant="glass">
            <p className="text-eyebrow mb-2 flex items-center gap-1.5">
              <Sparkles size={11} className="text-accent" /> AI insights
            </p>
            <ul className="space-y-1.5 text-sm">
              {session.insights.map((s) => (
                <li key={s} className="flex gap-2"><span className="text-accent">·</span> {s}</li>
              ))}
            </ul>
          </Card>

          <CheckInForm sessionId={id} onPosted={() => qc.invalidateQueries({ queryKey: ['coach-session', id] })} />

          {session.checkIns.length > 0 && (
            <Card variant="glass" className="!p-0">
              <header className="px-4 py-3 border-b border-border">
                <p className="text-eyebrow">Check-in history</p>
              </header>
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {[...session.checkIns].reverse().map((c, i) => (
                    <motion.div key={c.at}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-xl bg-surface p-3"
                    >
                      <p className="text-2xs text-muted">{formatRelative(c.at)} · feeling {c.mood}</p>
                      {c.insight && (
                        <p className="mt-1 text-xs italic flex gap-1.5">
                          <MessageCircleHeart size={11} className="text-accent mt-0.5 shrink-0" /> {c.insight}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function CheckInForm({ sessionId, onPosted }: { sessionId: string; onPosted: () => void }) {
  const [mood, setMood] = useState<'stuck' | 'okay' | 'great'>('okay');
  const [win, setWin] = useState('');
  const [block, setBlock] = useState('');
  const [next, setNext] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const r = await api.post(`/coach/sessions/${sessionId}/check-in`,
        { mood, win, block, next });
      setInsight(r.data.data.insight);
      setWin(''); setBlock(''); setNext('');
      onPosted();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <Card variant="glass">
      <p className="text-eyebrow mb-2">Weekly check-in</p>
      <div className="flex gap-1.5 mb-3">
        {([
          { id: 'stuck', icon: Frown, label: 'Stuck' },
          { id: 'okay',  icon: Meh,   label: 'Okay' },
          { id: 'great', icon: Smile, label: 'Great' }
        ] as const).map((m) => (
          <button key={m.id} onClick={() => setMood(m.id)}
            className={cn(
              'flex-1 rounded-lg border p-2 transition flex flex-col items-center gap-1',
              mood === m.id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
            )}>
            <m.icon size={14} /><span className="text-[10px]">{m.label}</span>
          </button>
        ))}
      </div>
      <Input variant="glass" size="sm" placeholder="One win this week" value={win} onChange={(e) => setWin(e.target.value)} />
      <Input variant="glass" size="sm" placeholder="What blocked you?" value={block} onChange={(e) => setBlock(e.target.value)} className="mt-2" />
      <Input variant="glass" size="sm" placeholder="Next step planned" value={next} onChange={(e) => setNext(e.target.value)} className="mt-2" />
      <Button variant="accent" magnetic className="w-full mt-3" loading={busy} onClick={submit}>
        <Sparkles size={13} /> Send & get insight
      </Button>

      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl bg-grad-accent/10 border border-accent/30 p-3"
        >
          <p className="text-2xs uppercase tracking-caps text-accent mb-1 flex items-center gap-1">
            <MessageCircleHeart size={11} /> Coach
          </p>
          <p className="text-sm text-fg-soft">{insight}</p>
        </motion.div>
      )}
    </Card>
  );
}
