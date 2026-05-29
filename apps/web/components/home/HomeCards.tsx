'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, UserPlus, ArrowRight, Users2, Briefcase, GraduationCap
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { fmtSalary } from '@/components/jobs/JobCard';
import { MatchRing } from '@/components/match/MatchRing';

/* ─── Job recommendation card ─── */
export function JobRecCard({ data }: { data: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/jobs/${data.jobId ?? data.job?._id}`}>
        <Card variant="glass" interactive className="!p-0 overflow-hidden hover-lift">
          <div className="p-4 flex items-start gap-4">
            <MatchRing value={data.match ?? 80} size={72} stroke={6} />
            <div className="flex-1 min-w-0">
              <Badge variant="accent" dot className="text-2xs mb-1.5">
                <Sparkles size={9} /> Picked for you
              </Badge>
              <p className="font-medium leading-tight">{data.job?.title}</p>
              <p className="text-xs text-muted">{data.job?.company?.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-2xs text-muted">
                {data.job?.remote && <span>Remote</span>}
                {data.job?.location && <span>· {data.job.location}</span>}
                {(data.job?.salaryMin || data.job?.salaryMax) && (
                  <span>· {fmtSalary(data.job.salaryMin, data.job.salaryMax, data.job.currency)}</span>
                )}
              </div>
              {data.aiExplanation && (
                <p className="mt-2 text-xs text-fg-soft line-clamp-2">{data.aiExplanation}</p>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

/* ─── People to follow ─── */
export function PeopleCard({ users }: { users: any[] }) {
  async function follow(id: string) { await api.post(`/users/follow/${id}`); }
  return (
    <Card variant="glass" className="!p-0 overflow-hidden">
      <header className="flex items-center gap-2 p-4 border-b border-border">
        <div className="size-9 rounded-xl bg-gradient-to-br from-[oklch(70%_0.24_340)] to-[var(--accent)] shadow-glow grid place-items-center">
          <UserPlus size={14} className="text-accent-fg" />
        </div>
        <div className="flex-1">
          <p className="font-display tracking-tighter">People to follow</p>
          <p className="text-2xs text-muted">Based on your network</p>
        </div>
      </header>
      <ul className="p-2 grid sm:grid-cols-2 gap-2">
        {users.map((u, i) => (
          <motion.li key={u._id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}>
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface transition">
              <Link href={`/profile/${u.handle}`}>
                <Avatar src={u.avatar} name={u.name} ring />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${u.handle}`} className="text-sm font-medium hover:underline truncate block">{u.name}</Link>
                <p className="text-2xs text-muted truncate">{u.headline ?? `@${u.handle}`}</p>
              </div>
              <Button size="xs" variant="glass" onClick={() => follow(u._id)}>Follow</Button>
            </div>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

/* ─── Communities to join ─── */
export function CommunitiesCard({ communities }: { communities: any[] }) {
  async function join(slug: string) { await api.post(`/communities/${slug}/join`); }
  return (
    <Card variant="glass" className="!p-0 overflow-hidden">
      <header className="flex items-center gap-2 p-4 border-b border-border">
        <div className="size-9 rounded-xl bg-gradient-to-br from-[oklch(78%_0.22_142)] to-[var(--accent)] shadow-glow grid place-items-center">
          <Users2 size={14} className="text-accent-fg" />
        </div>
        <div className="flex-1">
          <p className="font-display tracking-tighter">Communities for you</p>
          <p className="text-2xs text-muted">Trending in your space</p>
        </div>
      </header>
      <ul className="p-2 grid sm:grid-cols-2 gap-2">
        {communities.map((c, i) => (
          <motion.li key={c.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}>
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface transition">
              <div className="size-9 rounded-xl grid place-items-center text-white font-medium shadow-glow"
                style={{ background: c.accent ?? 'var(--accent)' }}>
                {c.icon
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.icon} alt="" className="size-full rounded-xl object-cover" />
                  : c.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/communities/${c.slug}`} className="text-sm font-medium hover:underline truncate block">{c.name}</Link>
                <p className="text-2xs text-muted">{c.membersCount?.toLocaleString() ?? 0} members</p>
              </div>
              <Button size="xs" variant="glass" onClick={() => join(c.slug)}>Join</Button>
            </div>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

/* ─── Suggested course / formation ─── */
export function CourseCard({ data }: { data: any }) {
  return (
    <Card variant="glass" className="!p-0 overflow-hidden">
      <div className="relative h-24 bg-grad-aurora animate-aurora">
        <div className="absolute inset-0 noise opacity-30" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge variant="soft" className="backdrop-blur"><GraduationCap size={11} /> Formation</Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="font-display text-lg tracking-tighter leading-tight">{data.title}</p>
        <p className="mt-1 text-xs text-muted">{data.provider}</p>
        <p className="mt-2 text-sm text-fg-soft">{data.description}</p>
        {data.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {data.skills.map((s: string) => <Badge key={s} variant="accent">{s}</Badge>)}
          </div>
        )}
        <Link href={data.url ?? '/roadmap'}>
          <Button variant="accent" size="sm" magnetic className="mt-4">
            <Sparkles size={13} /> Generate roadmap <ArrowRight size={13} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
