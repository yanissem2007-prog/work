'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles, FolderGit2, Rocket, Code2, Trophy, Globe2, ArrowRight, Github, ExternalLink,
  Bookmark, Hammer, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TiltCard, SpotlightCard, MagneticLink, LiquidButton, Stagger, StaggerItem } from '@/components/micro';
import { GithubConnectModal } from '@/components/projects/GithubConnectModal';
import { cn } from '@/lib/utils';

type Kind = 'portfolio' | 'github' | 'startup' | 'challenge' | 'realworld';
type Status = 'suggested' | 'saved' | 'in_progress' | 'built';

const KINDS: { id: Kind; label: string; icon: React.ComponentType<{ size?: number }>; tone: string }[] = [
  { id: 'portfolio', label: 'Portfolio',    icon: FolderGit2, tone: 'oklch(72% 0.2 264)' },
  { id: 'github',    label: 'Open-source',  icon: Github,     tone: 'oklch(78% 0.06 0)' },
  { id: 'startup',   label: 'Startup',      icon: Rocket,     tone: 'oklch(70% 0.24 340)' },
  { id: 'challenge', label: 'Challenge',    icon: Trophy,     tone: 'oklch(78% 0.22 142)' },
  { id: 'realworld', label: 'Real-world',   icon: Globe2,     tone: 'oklch(75% 0.22 50)' }
];

const STATUS_LABEL: Record<Status, string> = {
  suggested: 'Suggested',
  saved: 'Saved',
  in_progress: 'In progress',
  built: 'Built'
};

interface Idea {
  _id: string; kind: Kind; title: string; summary: string; why?: string;
  stack: string[]; skills: string[]; difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  estimatedWeeks: number;
  deliverables?: string[]; nextSteps?: string[];
  status: Status; repoUrl?: string; demoUrl?: string;
  color?: string;
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [goal, setGoal] = useState('');
  const [selectedKinds, setSelectedKinds] = useState<Kind[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [ghProjectId, setGhProjectId] = useState<string | null>(null);

  const list = useQuery<Idea[]>({
    queryKey: ['project-ideas', statusFilter],
    queryFn: async () => (await api.get('/projects', {
      params: { status: statusFilter === 'all' ? undefined : statusFilter }
    })).data.data
  });

  const suggest = useMutation({
    mutationFn: async () =>
      (await api.post('/projects/suggest', {
        goal: goal || undefined,
        kinds: selectedKinds.length ? selectedKinds : undefined
      })).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-ideas'] });
      toast.success('Ideas generated');
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) =>
      api.patch(`/projects/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-ideas'] })
  });

  function toggleKind(k: Kind) {
    setSelectedKinds((arr) => arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-8 sm:p-10"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Sparkles size={11} /> AI project ideas
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tightest max-w-2xl">
          Build the thing that <span className="gradient-text italic">lands the job</span>.
        </h1>
        <p className="mt-2 text-sm text-muted max-w-xl">
          Type your career goal, pick the kinds you want, and I'll generate 6 buildable ideas tailored to your skills.
        </p>
      </motion.section>

      {/* Generator */}
      <SpotlightCard className="rounded-3xl border border-border bg-bg-elev/40 p-6 sm:p-8" color="oklch(72% 0.2 264)">
        <p className="text-eyebrow mb-3">Your career goal (optional)</p>
        <Input variant="glass" size="lg"
          placeholder='e.g. "Senior frontend engineer in design-systems"'
          value={goal} onChange={(e) => setGoal(e.target.value)} />

        <p className="text-eyebrow mt-5 mb-2">Filter kinds (optional)</p>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => {
            const on = selectedKinds.includes(k.id);
            return (
              <button key={k.id} onClick={() => toggleKind(k.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs border transition',
                  on ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                )}>
                <k.icon size={11} /> {k.label}
              </button>
            );
          })}
        </div>

        <MagneticLink>
          <LiquidButton onClick={() => suggest.mutate()} className="mt-5">
            <Sparkles size={14} /> {suggest.isPending ? 'Generating…' : 'Generate ideas'} <ArrowRight size={14} />
          </LiquidButton>
        </MagneticLink>
      </SpotlightCard>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {(['all', 'suggested', 'saved', 'in_progress', 'built'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-pill px-3 py-1 text-xs border transition shrink-0 capitalize',
              statusFilter === s ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
            )}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {list.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!list.isLoading && (list.data?.length ?? 0) === 0 && (
        <Card variant="glass" className="text-center py-16">
          <Sparkles size={26} className="mx-auto text-accent" />
          <p className="mt-3 font-medium">No ideas yet — generate your first batch.</p>
        </Card>
      )}

      {/* Grid */}
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.data?.map((idea) => {
          const k = KINDS.find((x) => x.id === idea.kind)!;
          return (
            <StaggerItem key={idea._id}>
              <TiltCard max={6} className="h-full">
                <Card variant="glass" className="h-full !p-0 overflow-hidden hover-lift">
                  <div className="relative h-24" style={{ background: `linear-gradient(135deg, ${idea.color ?? k.tone}, var(--accent))` }}>
                    <div className="absolute inset-0 noise opacity-30" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge variant="soft" className="backdrop-blur"><k.icon size={11} /> {k.label}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="soft" className="capitalize backdrop-blur">{idea.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="font-display text-lg tracking-tighter leading-tight">{idea.title}</p>
                    <p className="text-sm text-fg-soft line-clamp-3">{idea.summary}</p>
                    {idea.why && (
                      <p className="text-2xs text-accent flex items-start gap-1.5">
                        <Sparkles size={11} className="mt-0.5 shrink-0" /> {idea.why}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {idea.stack.slice(0, 6).map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
                    </div>

                    <div className="flex items-center justify-between text-2xs text-muted">
                      <span>~{idea.estimatedWeeks}w</span>
                      <span className="capitalize">{STATUS_LABEL[idea.status]}</span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      {idea.status === 'suggested' && (
                        <Button size="sm" variant="glass" className="flex-1" onClick={() => update.mutate({ id: idea._id, status: 'saved' })}>
                          <Bookmark size={13} /> Save
                        </Button>
                      )}
                      {(idea.status === 'saved' || idea.status === 'suggested') && (
                        <Button size="sm" variant="accent" className="flex-1" onClick={() => update.mutate({ id: idea._id, status: 'in_progress' })}>
                          <Hammer size={13} /> Build
                        </Button>
                      )}
                      {idea.status === 'in_progress' && (
                        <Button size="sm" variant="accent" className="flex-1" onClick={() => update.mutate({ id: idea._id, status: 'built' })}>
                          <CheckCircle2 size={13} /> Mark built
                        </Button>
                      )}
                      {idea.status === 'built' && (
                        <Badge variant="success" dot className="flex-1 justify-center py-1.5">
                          <CheckCircle2 size={12} /> Shipped
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="xs" variant="ghost" className="flex-1" onClick={() => setGhProjectId(idea._id)}>
                        <Github size={11} /> {idea.repoUrl ? 'Re-connect repo' : 'Connect GitHub'}
                      </Button>
                      {idea.repoUrl && (
                        <a href={idea.repoUrl} target="_blank" rel="noopener" className="inline-flex items-center text-2xs text-accent px-2 py-1 rounded-pill border border-accent/30 hover:bg-accent/10">
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </StaggerItem>
          );
        })}
      </Stagger>

      <GithubConnectModal
        open={!!ghProjectId}
        onOpenChange={(v) => { if (!v) setGhProjectId(null); }}
        projectId={ghProjectId ?? ''}
      />
    </div>
  );
}
