'use client';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, TrendingUp, Briefcase, Users2, Cpu, Lightbulb, Heart, MessageCircle, Repeat2,
  Sparkles, Building2, Radio
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TrendingBar } from '@/components/trending/TrendingBar';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { formatRelative, cn } from '@/lib/utils';

interface Overview {
  generatedAt: string;
  posts: Array<{ id: string; content: string; createdAt: string; score: number; likes: number; comments: number; reposts: number; author?: { handle?: string; name?: string; avatar?: string } }>;
  jobs: Array<{ id: string; title: string; applicantsCount: number; viewsCount: number; createdAt: string; applicantsLastDay: number; company?: { name?: string; slug?: string; logo?: string } }>;
  skills: Array<{ skill: string; jobMentions: number; postMentions: number; score: number }>;
  technologies: Array<{ tech: string; jobs: number; posts: number; score: number }>;
  communities: Array<{ id: string; slug: string; name: string; icon?: string; accent?: string; membersCount: number; newJoiners: number; score: number }>;
}

export default function TrendingPage() {
  const qc = useQueryClient();
  const socket = useSocket();

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['trending'],
    queryFn: async () => (await api.get('/trending')).data.data,
    refetchInterval: 60_000
  });

  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Real-time: socket pushes the whole overview every minute.
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (next: Overview) => {
      qc.setQueryData(['trending'], next);
      setLastUpdate(new Date().toISOString());
    };
    socket.on('trending:update', onUpdate);
    return () => { socket.off('trending:update', onUpdate); };
  }, [socket, qc]);

  const totals = useMemo(() => ({
    posts: data?.posts.reduce((s, p) => s + p.likes + p.comments + p.reposts, 0) ?? 0,
    jobs: data?.jobs.reduce((s, j) => s + j.applicantsLastDay, 0) ?? 0,
    communities: data?.communities.reduce((s, c) => s + c.newJoiners, 0) ?? 0
  }), [data]);

  if (isLoading || !data) return <div className="grid place-items-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-8 sm:p-10"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
              <Flame size={11} /> Trending now
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tightest">
              What's <span className="gradient-text italic">heating up</span>.
            </h1>
            <p className="mt-2 text-sm text-muted">Last 24 hours · refreshed every minute.</p>
          </div>
          <LivePill lastUpdate={lastUpdate ?? data.generatedAt} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={Heart} label="Engagements" value={totals.posts} tone="oklch(70% 0.24 340)" />
          <Stat icon={Briefcase} label="New applications" value={totals.jobs} tone="oklch(78% 0.18 200)" />
          <Stat icon={Users2} label="New community joins" value={totals.communities} tone="oklch(78% 0.22 142)" />
        </div>
      </motion.section>

      {/* 2-col layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard icon={Flame} title="Trending posts" subtitle="Engagement velocity" tone="oklch(70% 0.24 340)">
          <PostsList items={data.posts} />
        </SectionCard>

        <SectionCard icon={Briefcase} title="Trending jobs" subtitle="Apply velocity" tone="oklch(78% 0.18 200)">
          <JobsList items={data.jobs} />
        </SectionCard>

        <SectionCard icon={Lightbulb} title="Trending skills" subtitle="Across jobs + posts" tone="oklch(75% 0.22 50)">
          <SkillsList items={data.skills} />
        </SectionCard>

        <SectionCard icon={Cpu} title="Trending technologies" subtitle="Cross-platform mentions" tone="oklch(72% 0.2 264)">
          <TechList items={data.technologies} />
        </SectionCard>

        <SectionCard icon={Users2} title="Trending communities" subtitle="Fastest growing" tone="oklch(78% 0.22 142)" className="lg:col-span-2">
          <CommunitiesList items={data.communities} />
        </SectionCard>
      </div>
    </div>
  );
}

/* ─── Pieces ─── */

function LivePill({ lastUpdate }: { lastUpdate: string }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => { setPulse((p) => p + 1); }, [lastUpdate]);
  return (
    <motion.div
      key={pulse}
      initial={{ scale: 0.95, boxShadow: '0 0 0 0 oklch(78% 0.22 142 / 0.5)' }}
      animate={{ scale: 1, boxShadow: '0 0 0 12px oklch(78% 0.22 142 / 0)' }}
      transition={{ duration: 1.2 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-success/30 bg-success/10 text-success text-xs font-medium"
    >
      <Radio size={12} className="animate-pulse" /> Live · {formatRelative(lastUpdate)}
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, tone }:
  { icon: LucideIcon; label: string; value: number; tone: string }) {
  const display = useAnimatedCounter(value);
  return (
    <div className="rounded-2xl border border-border bg-bg-elev/50 p-4 flex items-center gap-3">
      <div className="size-10 rounded-xl grid place-items-center shadow-glow shrink-0"
        style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-2xs uppercase tracking-caps text-muted truncate">{label}</p>
        <p className="font-display text-2xl tracking-tighter tabular-nums" style={{ color: tone }}>
          {display.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon, title, subtitle, tone, children, className
}: {
  icon: LucideIcon;
  title: string; subtitle: string; tone: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <Card variant="glass" className={cn('!p-0 overflow-hidden', className)}>
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <div className="size-9 rounded-xl grid place-items-center shadow-glow shrink-0"
          style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}>
          <Icon size={14} />
        </div>
        <div className="flex-1">
          <p className="font-display tracking-tighter">{title}</p>
          <p className="text-2xs text-muted">{subtitle}</p>
        </div>
        <Sparkles size={12} className="text-accent animate-pulse" />
      </header>
      <div className="p-2 sm:p-3">{children}</div>
    </Card>
  );
}

function Rank({ n }: { n: number }) {
  const tone = n === 1 ? 'oklch(75% 0.22 50)' : n === 2 ? 'oklch(78% 0.06 0)' : n === 3 ? 'oklch(60% 0.13 50)' : 'var(--muted)';
  return <span className="font-display text-base tracking-tighter tabular-nums w-6 text-center" style={{ color: tone }}>{n}</span>;
}

function PostsList({ items }: { items: Overview['posts'] }) {
  const maxScore = Math.max(1, ...items.map((p) => p.score));
  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {items.map((p, i) => (
          <motion.li key={p.id}
            layout
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="rounded-xl px-3 py-2.5 hover:bg-surface transition flex items-center gap-3"
          >
            <Rank n={i + 1} />
            <Avatar src={p.author?.avatar} name={p.author?.name ?? '—'} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-1">{p.content}</p>
              <div className="flex items-center gap-3 mt-0.5 text-2xs text-muted">
                <span className="flex items-center gap-1"><Heart size={10} /> {p.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle size={10} /> {p.comments}</span>
                <span className="flex items-center gap-1"><Repeat2 size={10} /> {p.reposts}</span>
                <span>· {formatRelative(p.createdAt)}</span>
              </div>
              <div className="mt-1.5">
                <TrendingBar value={p.score} max={maxScore} tone="oklch(70% 0.24 340)" />
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function JobsList({ items }: { items: Overview['jobs'] }) {
  const max = Math.max(1, ...items.map((j) => j.applicantsLastDay));
  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {items.map((j, i) => (
          <motion.li key={j.id} layout
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: i * 0.03 }}>
            <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface transition">
              <Rank n={i + 1} />
              <div className="size-9 rounded-lg border border-border overflow-hidden bg-bg-elev grid place-items-center shrink-0">
                {j.company?.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={j.company.logo} alt="" className="size-full object-cover" />
                  : <Building2 size={14} className="text-muted" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{j.title}</p>
                <p className="text-2xs text-muted truncate">{j.company?.name}</p>
                <div className="mt-1.5">
                  <TrendingBar value={j.applicantsLastDay} max={max} tone="oklch(78% 0.18 200)" />
                </div>
              </div>
              <Badge variant="soft" dot dotColor="oklch(78% 0.18 200)">
                <TrendingUp size={10} /> +{j.applicantsLastDay} / 24h
              </Badge>
            </Link>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function SkillsList({ items }: { items: Overview['skills'] }) {
  const max = Math.max(1, ...items.map((s) => s.score));
  return (
    <ul className="space-y-2 p-1">
      {items.map((s, i) => (
        <motion.li key={s.skill}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="grid grid-cols-[24px_1fr_72px] items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface transition"
        >
          <Rank n={i + 1} />
          <div>
            <p className="text-sm font-medium capitalize">{s.skill}</p>
            <TrendingBar value={s.score} max={max} tone="oklch(75% 0.22 50)" />
          </div>
          <span className="text-2xs text-muted tabular-nums text-right">
            {s.jobMentions} jobs · {s.postMentions} posts
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function TechList({ items }: { items: Overview['technologies'] }) {
  const max = Math.max(1, ...items.map((t) => t.score));
  return (
    <ul className="space-y-2 p-1">
      {items.map((t, i) => (
        <motion.li key={t.tech}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="grid grid-cols-[24px_1fr_72px] items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface transition"
        >
          <Rank n={i + 1} />
          <div>
            <p className="text-sm font-medium">{t.tech}</p>
            <TrendingBar value={t.score} max={max} tone="oklch(72% 0.2 264)" />
          </div>
          <span className="text-2xs text-muted tabular-nums text-right">
            {t.jobs} jobs · {t.posts} posts
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function CommunitiesList({ items }: { items: Overview['communities'] }) {
  const max = Math.max(1, ...items.map((c) => c.score));
  return (
    <ul className="grid sm:grid-cols-2 gap-2 p-1">
      {items.map((c, i) => (
        <motion.li key={c.id}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}>
          <Link href={`/communities/${c.slug}`}
            className="block rounded-xl px-3 py-2.5 hover:bg-surface transition">
            <div className="flex items-center gap-3">
              <Rank n={i + 1} />
              <div className="size-9 rounded-xl grid place-items-center text-white font-medium shrink-0"
                style={{ background: c.accent ?? 'var(--accent)' }}>
                {c.icon
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.icon} alt="" className="size-full rounded-xl object-cover" />
                  : c.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-2xs text-muted">{c.membersCount.toLocaleString()} members</p>
              </div>
              <Badge variant="soft" dot dotColor="oklch(78% 0.22 142)">
                +{c.newJoiners}
              </Badge>
            </div>
            <div className="mt-2">
              <TrendingBar value={c.score} max={max} tone="oklch(78% 0.22 142)" />
            </div>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
