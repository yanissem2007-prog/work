'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, MapPin, Globe2, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MatchRing } from './MatchRing';
import { fmtSalary } from '@/components/jobs/JobCard';
import { TiltCard, SpotlightCard } from '@/components/micro';
import { cn } from '@/lib/utils';

interface Job {
  _id: string; title: string; type: string; experienceLevel: string;
  location?: string; remote?: boolean;
  salaryMin?: number; salaryMax?: number; currency?: string;
  company?: { name?: string; slug?: string; logo?: string; verified?: boolean };
}

export interface MatchItem {
  match: number;
  jobId: string;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  aiExplanation?: string;
  breakdown: { skills: number; experience: number; location: number; recency: number; interests: number };
  job: Job;
}

export function MatchCard({ item, index = 0 }: { item: MatchItem; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl"
    >
      <TiltCard max={5}>
      <SpotlightCard className="glass rounded-2xl p-5 hover-lift">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-xl bg-bg-elev border border-border grid place-items-center overflow-hidden shrink-0">
          {item.job.company?.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.job.company.logo} alt="" className="size-full object-cover" />
            : <Building2 size={20} className="text-muted" />}
        </div>

        <div className="flex-1 min-w-0">
          <Link href={`/jobs/${item.jobId}`} className="font-medium leading-tight hover:underline block">
            {item.job.title}
          </Link>
          <p className="text-xs text-muted truncate">
            {item.job.company?.name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              {item.job.remote ? <><Globe2 size={11} /> Remote</> : <><MapPin size={11} /> {item.job.location ?? '—'}</>}
            </span>
            <span className="capitalize">· {item.job.experienceLevel}</span>
            {(item.job.salaryMin || item.job.salaryMax) && (
              <span>· {fmtSalary(item.job.salaryMin, item.job.salaryMax, item.job.currency)}</span>
            )}
          </div>
        </div>

        <MatchRing value={item.match} size={84} />
      </div>

      {item.aiExplanation && (
        <p className="mt-3 text-sm text-fg-soft flex gap-2">
          <Sparkles size={12} className="text-accent shrink-0 mt-1" /> {item.aiExplanation}
        </p>
      )}

      {/* Breakdown rail */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {(['skills', 'experience', 'location', 'recency', 'interests'] as const).map((k) => {
          const v = item.breakdown[k];
          const tone = v >= 75 ? 'oklch(78% 0.22 142)' : v >= 55 ? 'oklch(78% 0.18 200)' : 'oklch(78% 0.18 70)';
          return (
            <div key={k}>
              <div className="h-1 bg-surface-2 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: `${v}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                  style={{ background: `linear-gradient(90deg, var(--accent), ${tone})`, boxShadow: `0 0 6px ${tone}` }}
                />
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-caps text-muted capitalize">{k}</p>
            </div>
          );
        })}
      </div>

      {/* Skills overlap */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-2xs uppercase tracking-caps text-success mb-1.5">Matched skills</p>
          <div className="flex flex-wrap gap-1">
            {item.matchedSkills.length === 0
              ? <span className="text-2xs text-muted">No overlap</span>
              : item.matchedSkills.slice(0, 8).map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
          </div>
        </div>
        <div>
          <p className="text-2xs uppercase tracking-caps text-warning mb-1.5">Gap</p>
          <div className="flex flex-wrap gap-1">
            {item.missingSkills.length === 0
              ? <span className="text-2xs text-muted">Complete</span>
              : item.missingSkills.slice(0, 6).map((s) => <Badge key={s} variant="outline">+ {s}</Badge>)}
          </div>
        </div>
      </div>

      <Link href={`/jobs/${item.jobId}`} className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
        View role <ArrowRight size={13} />
      </Link>
      </SpotlightCard>
      </TiltCard>
    </motion.div>
  );
}
