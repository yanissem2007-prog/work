'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Globe2, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { Application, ApplicationStatus } from '@work/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelative, cn } from '@/lib/utils';

const FLOW: ApplicationStatus[] = ['submitted', 'reviewing', 'interview', 'offer'];

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  submitted: 'oklch(72% 0.2 264)',
  reviewing: 'oklch(80% 0.14 200)',
  interview: 'oklch(75% 0.22 50)',
  offer: 'oklch(72% 0.2 142)',
  rejected: 'oklch(65% 0.2 25)',
  withdrawn: 'oklch(60% 0 0)'
};

export default function ApplicationsPage() {
  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ['my-applications'],
    queryFn: async () => (await api.get('/jobs/applications')).data.data
  });

  const byStatus: Record<string, Application[]> = {};
  apps.forEach((a) => {
    if (!byStatus[a.status]) byStatus[a.status] = [];
    byStatus[a.status].push(a);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tighter">My applications</h1>
        <p className="text-sm text-muted mt-1">Track every role you applied to.</p>
      </header>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!isLoading && apps.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <Briefcase size={28} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">No applications yet.</p>
          <Link href="/jobs" className="text-sm text-accent hover:underline">Browse jobs →</Link>
        </Card>
      )}

      <div className="space-y-3">
        {apps.map((a) => (
          <motion.div key={a._id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/jobs/${a.jobId}`} className="font-medium hover:underline">
                    {a.job?.title ?? 'Job'}
                  </Link>
                  {a.status === 'offer' && <CheckCircle2 size={14} className="text-success" />}
                </div>
                <p className="text-sm text-muted">{a.job?.company?.name ?? '—'}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    {a.job?.remote ? <><Globe2 size={11} /> Remote</> : <><MapPin size={11} /> {a.job?.location ?? '—'}</>}
                  </span>
                  <span>Applied {formatRelative(a.createdAt)}</span>
                </div>
              </div>

              <Badge variant="soft" dot dotColor={STATUS_COLOR[a.status]} className="capitalize">
                {a.status}
              </Badge>

              <Link href={`/jobs/${a.jobId}`}>
                <Badge variant="outline" className="flex items-center gap-1">
                  View <ExternalLink size={10} />
                </Badge>
              </Link>
            </div>

            {/* Progress rail */}
            {a.status !== 'rejected' && a.status !== 'withdrawn' && (
              <div className="mt-4 flex items-center gap-1">
                {FLOW.map((stage, i) => {
                  const reached = FLOW.indexOf(a.status) >= i;
                  return (
                    <div key={stage} className="flex-1 flex items-center gap-1">
                      <div className={cn(
                        'flex-1 h-1 rounded-full transition-colors',
                        reached ? 'bg-grad-accent' : 'bg-border'
                      )} />
                      <span className={cn(
                        'text-[10px] uppercase tracking-caps shrink-0',
                        reached ? 'text-fg' : 'text-muted'
                      )}>{stage}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
