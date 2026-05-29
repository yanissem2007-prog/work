'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import type { Job } from '@work/types';
import { api } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function SavedJobsPage() {
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['saved-jobs'],
    queryFn: async () => (await api.get('/jobs/saved')).data.data
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl tracking-tighter">Saved jobs</h1>
        <p className="text-sm text-muted mt-1">Roles you bookmarked.</p>
      </header>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!isLoading && jobs.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <Bookmark size={28} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">Nothing saved yet.</p>
          <Link href="/jobs" className="text-sm text-accent hover:underline">Browse jobs →</Link>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((j) => <JobCard key={j._id} job={j} saved />)}
      </div>
    </div>
  );
}
