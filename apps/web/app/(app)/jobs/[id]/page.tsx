'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, MapPin, Globe2, Briefcase, GraduationCap, Bookmark, ArrowLeft, ExternalLink, CheckCircle2, Sparkles, Users2 } from 'lucide-react';
import type { Job } from '@work/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { fmtSalary } from '@/components/jobs/JobCard';
import { ApplyDrawer } from '@/components/jobs/ApplyDrawer';
import { MatchRing } from '@/components/match/MatchRing';
import { formatRelative } from '@/lib/utils';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ['job', id],
    queryFn: async () => (await api.get(`/jobs/${id}`)).data.data
  });

  const { data: matchScore } = useQuery<{ match: number; matchedSkills: string[]; missingSkills: string[] }>({
    queryKey: ['match', 'job', id],
    queryFn: async () => (await api.get(`/match/job/${id}`)).data.data
  });

  const { data: myApps } = useQuery<{ jobId: string }[]>({
    queryKey: ['my-applications-ids'],
    queryFn: async () => (await api.get('/jobs/applications')).data.data
  });
  const applied = myApps?.some((a) => a.jobId === id);

  async function save() { await api.post(`/jobs/${id}/save`); }

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (!job) return <p className="text-muted">Not found.</p>;

  const isRecruiter = user?.id === job.recruiterId;

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> Back to jobs
      </Link>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="size-16 rounded-2xl bg-bg-elev border border-border grid place-items-center overflow-hidden shrink-0">
            {job.company?.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={job.company.logo} alt="" className="size-full object-cover" />
              : <Building2 size={26} className="text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link href={`/companies/${job.company?.slug}`} className="text-sm hover:underline">
                {job.company?.name}
              </Link>
              {job.company?.verified && <CheckCircle2 size={12} className="text-accent" />}
              <Badge variant="success" dot>{job.applicantsCount ?? 0} applicants</Badge>
            </div>
            <h1 className="font-display text-3xl tracking-tighter">{job.title}</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                {job.remote ? <><Globe2 size={14} /> Remote</> : <><MapPin size={14} /> {job.location ?? '—'}</>}
              </span>
              <span className="flex items-center gap-1"><Briefcase size={14} /> {job.type.replace('-', ' ')}</span>
              <span className="flex items-center gap-1"><GraduationCap size={14} /> {job.experienceLevel}</span>
              <span>· Posted {formatRelative(job.createdAt)}</span>
            </div>
            {(job.salaryMin || job.salaryMax) && (
              <p className="mt-3 text-lg font-medium">{fmtSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
            )}
          </div>

          {matchScore && (
            <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
              <MatchRing value={matchScore.match} size={96} />
              <p className="text-2xs uppercase tracking-caps text-muted">your match</p>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px]">
            {isRecruiter ? (
              <Link href={`/jobs/manage`}>
                <Button variant="glass" size="lg" className="w-full">Manage</Button>
              </Link>
            ) : applied ? (
              <Button variant="glass" size="lg" disabled className="w-full">
                <CheckCircle2 size={16} /> Applied
              </Button>
            ) : (
              <Button variant="accent" size="lg" magnetic className="w-full" onClick={() => setApplyOpen(true)}>
                Apply now
              </Button>
            )}
            <Button variant="glass" size="lg" className="w-full" onClick={save}>
              <Bookmark size={16} /> Save
            </Button>
            {job.applyUrl && (
              <a href={job.applyUrl} target="_blank" rel="noopener">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  External link <ExternalLink size={12} />
                </Button>
              </a>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <section className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl tracking-tighter mb-3">About the role</h2>
            <p className="text-sm text-fg-soft whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>

          {job.skills.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl tracking-tighter mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
              </div>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl tracking-tighter mb-3">Benefits</h2>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {job.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-fg-soft">
                    <Sparkles size={12} className="text-accent" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-4 h-fit">
          <div className="glass rounded-2xl p-5">
            <p className="text-eyebrow mb-3">About {job.company?.name}</p>
            {job.company?.description && (
              <p className="text-sm text-muted line-clamp-4">{job.company.description}</p>
            )}
            <div className="mt-3 space-y-1.5 text-xs text-muted">
              {job.company?.industry && <p>{job.company.industry}</p>}
              {job.company?.size && <p className="flex items-center gap-1"><Users2 size={11} /> {job.company.size} employees</p>}
              {job.company?.location && <p className="flex items-center gap-1"><MapPin size={11} /> {job.company.location}</p>}
            </div>
            <Link href={`/companies/${job.company?.slug}`} className="mt-4 block">
              <Button variant="glass" size="sm" className="w-full">View company</Button>
            </Link>
          </div>
        </aside>
      </div>

      <ApplyDrawer
        job={job}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onApplied={() => qc.invalidateQueries({ queryKey: ['my-applications-ids'] })}
      />
    </div>
  );
}
