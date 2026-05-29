'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Map, Sparkles, Trophy, Calendar, Briefcase } from 'lucide-react';
import { useRef } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TimelineNode } from '@/components/roadmap/TimelineNode';

interface Step {
  id: string; title: string; description?: string;
  kind?: 'skill' | 'project' | 'resource' | 'milestone';
  durationWeeks?: number;
  resources?: { title: string; url?: string }[];
  done?: boolean;
}

interface Phase {
  id: string; title: string; summary?: string; weeks: number;
  skills: string[]; steps: Step[];
}

interface Roadmap {
  _id: string;
  goal: string; level: string;
  title?: string; summary?: string;
  totalWeeks: number;
  phases: Phase[];
  finalProject?: string;
  careerPaths?: string[];
  progress: { stepsTotal: number; stepsDone: number };
}

export default function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: rm, isLoading } = useQuery<Roadmap>({
    queryKey: ['roadmap', id],
    queryFn: async () => (await api.get(`/roadmap/${id}`)).data.data
  });

  const toggle = useMutation({
    mutationFn: async ({ phaseId, stepId, done }: { phaseId: string; stepId: string; done: boolean }) =>
      api.patch(`/roadmap/${id}/phases/${phaseId}/steps/${stepId}`, { done }),
    onMutate: async ({ phaseId, stepId, done }) => {
      // Optimistic update
      qc.setQueryData<Roadmap>(['roadmap', id], (old) => {
        if (!old) return old;
        const phases = old.phases.map((p) =>
          p.id !== phaseId ? p :
          { ...p, steps: p.steps.map((s) => s.id === stepId ? { ...s, done } : s) }
        );
        const stepsDone = phases.reduce((n, p) => n + p.steps.filter((s) => s.done).length, 0);
        return { ...old, phases, progress: { ...old.progress, stepsDone } };
      });
    }
  });

  if (isLoading || !rm) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const pct = rm.progress.stepsTotal ? Math.round((rm.progress.stepsDone / rm.progress.stepsTotal) * 100) : 0;
  const isComplete = rm.progress.stepsTotal > 0 && rm.progress.stepsDone === rm.progress.stepsTotal;

  return (
    <div className="space-y-8">
      <Link href="/roadmap" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> All roadmaps
      </Link>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-8 sm:p-10"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="soft" dot dotColor="var(--accent)"><Map size={11} /> Roadmap</Badge>
          <Badge variant="soft" className="capitalize">{rm.level}</Badge>
          <Badge variant="soft" dot><Calendar size={11} /> {rm.totalWeeks} weeks</Badge>
          {isComplete && <Badge variant="success" dot><Trophy size={11} /> Complete</Badge>}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl tracking-tightest leading-tight">{rm.title ?? rm.goal}</h1>
        {rm.summary && <p className="mt-3 text-muted max-w-2xl">{rm.summary}</p>}

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 text-2xs text-muted">
            <span>Progress</span>
            <span className="tabular-nums font-medium text-fg">{rm.progress.stepsDone} / {rm.progress.stepsTotal} steps · {pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: pct / 100 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full origin-left bg-grad-accent shadow-glow"
            />
          </div>
        </div>

        {rm.careerPaths && rm.careerPaths.length > 0 && (
          <div className="mt-6">
            <p className="text-eyebrow mb-2 flex items-center gap-1.5">
              <Briefcase size={11} /> Career paths this opens
            </p>
            <div className="flex flex-wrap gap-1.5">
              {rm.careerPaths.map((c) => <Badge key={c} variant="accent">{c}</Badge>)}
            </div>
          </div>
        )}
      </motion.section>

      {/* Timeline */}
      <Timeline rm={rm} onToggle={(phaseId, stepId, done) => toggle.mutate({ phaseId, stepId, done })} />

      {/* Final project */}
      {rm.finalProject && (
        <Card variant="glass">
          <p className="text-eyebrow mb-2 flex items-center gap-1.5">
            <Trophy size={11} className="text-warning" /> Final project
          </p>
          <p className="text-sm text-fg-soft leading-relaxed">{rm.finalProject}</p>
        </Card>
      )}
    </div>
  );
}

function Timeline({ rm, onToggle }:
  { rm: Roadmap; onToggle: (phaseId: string, stepId: string, done: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div ref={ref} className="relative">
      {/* Center vertical line (desktop) */}
      <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-border" />
      {/* Active line follows scroll */}
      <motion.div
        className="hidden sm:block absolute left-1/2 top-0 -translate-x-1/2 w-px bg-grad-accent shadow-glow origin-top"
        style={{ height: lineHeight }}
      />
      {/* Mobile vertical line on left */}
      <div className="sm:hidden absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-12">
        {rm.phases.map((phase, pi) => (
          <section key={phase.id}>
            {/* Phase header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6 flex items-center gap-3"
            >
              <div className="size-10 rounded-2xl bg-grad-accent shadow-glow grid place-items-center font-display tracking-tighter tabular-nums text-accent-fg z-10">
                {pi + 1}
              </div>
              <div>
                <p className="text-2xs uppercase tracking-caps text-muted">Phase {pi + 1} · {phase.weeks} weeks</p>
                <h2 className="font-display text-2xl tracking-tighter leading-tight">{phase.title}</h2>
                {phase.summary && <p className="text-sm text-muted mt-1 max-w-2xl">{phase.summary}</p>}
                {phase.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {phase.skills.map((s) => (
                      <span key={s} className="text-2xs px-1.5 py-0.5 rounded bg-surface text-muted">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Steps */}
            <div className="space-y-5">
              {phase.steps.map((step, i) => (
                <TimelineNode
                  key={step.id}
                  step={step}
                  index={i}
                  side={i % 2 === 0 ? 'right' : 'left'}
                  onToggle={() => onToggle(phase.id, step.id, !step.done)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
