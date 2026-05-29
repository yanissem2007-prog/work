'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Users2, ChevronDown, ChevronUp, Check, X, Mail } from 'lucide-react';
import type { Application, Job, ApplicationStatus } from '@work/types';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelative, cn } from '@/lib/utils';

export default function ManageJobsPage() {
  useAuth({ required: true, roles: ['recruiter', 'company', 'admin'] });

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['my-jobs'],
    queryFn: async () => (await api.get('/jobs/manage/mine')).data.data
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tighter">Your jobs</h1>
          <p className="text-sm text-muted mt-1">Manage postings and review applications.</p>
        </div>
        <Link href="/jobs/new">
          <Button variant="accent" magnetic><Plus size={14} /> New job</Button>
        </Link>
      </header>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}

      {!isLoading && jobs.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <p className="font-medium">No jobs yet.</p>
          <p className="text-sm text-muted mt-1">Post your first role and start hiring.</p>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((j) => <JobRow key={j._id} job={j} />)}
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-2/30 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{job.title}</p>
            <Badge variant={job.status === 'open' ? 'success' : 'soft'} dot>{job.status}</Badge>
          </div>
          <p className="text-xs text-muted">
            {formatRelative(job.createdAt)} · {job.viewsCount ?? 0} views
          </p>
        </div>
        <Badge variant="soft" dot dotColor="var(--accent)">
          <Users2 size={11} /> {job.applicantsCount ?? 0} applicants
        </Badge>
        <Link href={`/jobs/${job._id}`} className="text-muted hover:text-fg p-1" aria-label="View">
          <Eye size={14} />
        </Link>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <ApplicantsList jobId={job._id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const STATUS_FLOW: ApplicationStatus[] = ['submitted', 'reviewing', 'interview', 'offer', 'rejected'];

function ApplicantsList({ jobId }: { jobId: string }) {
  const qc = useQueryClient();
  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ['job-applications', jobId],
    queryFn: async () => (await api.get(`/jobs/${jobId}/applications`)).data.data
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.patch(`/jobs/applications/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-applications', jobId] })
  });

  if (isLoading) return <div className="grid place-items-center py-6"><Spinner size={18} /></div>;
  if (apps.length === 0) return <p className="text-center text-sm text-muted py-6">No applicants yet.</p>;

  return (
    <div className="divide-y divide-border">
      {apps.map((a) => (
        <div key={a._id} className="p-4 flex items-center gap-3 flex-wrap">
          <Avatar src={a.applicant?.avatar} name={a.applicant?.name ?? '—'} ring />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{a.applicant?.name}</p>
            <p className="text-xs text-muted truncate">{a.applicant?.headline ?? '—'}</p>
          </div>
          <Badge variant="soft" className="capitalize">{a.status}</Badge>
          <div className="flex gap-1">
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus.mutate({ id: a._id, status: s })}
                className={cn(
                  'text-2xs px-2 py-1 rounded-md border transition capitalize',
                  a.status === s
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-muted hover:text-fg'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {a.cvUrl && (
            <a href={a.cvUrl} target="_blank" rel="noopener" className="text-2xs text-accent hover:underline">CV</a>
          )}
          <Button size="icon" variant="ghost" aria-label="Message"><Mail size={14} /></Button>
        </div>
      ))}
    </div>
  );
}
