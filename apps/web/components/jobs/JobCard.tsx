'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, MapPin, Globe2, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Job } from '@work/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelative } from '@/lib/utils';

interface Props { job: Job; saved?: boolean; onClick?: () => void; matchScore?: number }

export function JobCard({ job, saved: initSaved, onClick, matchScore }: Props) {
  const [saved, setSaved] = useState(!!initSaved);
  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setSaved((v) => !v);
    await api.post(`/jobs/${job._id}/save`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group relative glass rounded-2xl p-5 hover:bg-bg-elev/60 transition cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-xl bg-bg-elev border border-border grid place-items-center overflow-hidden shrink-0">
          {job.company?.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={job.company.logo} alt="" className="size-full object-cover" />
            : <Building2 size={20} className="text-muted" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/jobs/${job._id}`} className="block font-medium hover:underline">
                {job.title}
              </Link>
              <p className="text-sm text-muted flex items-center gap-1.5 truncate">
                {job.company?.name}
                {job.company?.verified && <CheckCircle2 size={12} className="text-accent" />}
              </p>
            </div>
            <button onClick={toggleSave}
              className={cn(
                'shrink-0 size-9 rounded-full grid place-items-center transition',
                saved ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface hover:text-fg'
              )}
              aria-label={saved ? 'Saved' : 'Save'}
            >
              <Bookmark size={15} className={cn(saved && 'fill-current')} />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              {job.remote ? <><Globe2 size={12} /> Remote</> : <><MapPin size={12} /> {job.location ?? '—'}</>}
            </span>
            {job.region && <span>· {job.region}</span>}
            <span>· {formatRelative(job.createdAt)}</span>
          </div>

          {(job.salaryMin || job.salaryMax) && (
            <p className="mt-2 text-sm font-medium">
              {fmtSalary(job.salaryMin, job.salaryMax, job.currency)}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {matchScore !== undefined && (
              <Badge variant="accent" dot>
                <Sparkles size={10} /> {matchScore}% match
              </Badge>
            )}
            <Badge variant="soft" className="capitalize">{job.type.replace('-', ' ')}</Badge>
            <Badge variant="soft" className="capitalize">{job.experienceLevel}</Badge>
            {job.skills.slice(0, 3).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            {job.skills.length > 3 && <Badge variant="outline">+{job.skills.length - 3}</Badge>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function fmtSalary(min?: number, max?: number, ccy = 'USD') {
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  if (min && max) return `${fmt(min)}–${fmt(max)} ${ccy}`;
  if (min) return `${fmt(min)}+ ${ccy}`;
  if (max) return `Up to ${fmt(max)} ${ccy}`;
  return '';
}
