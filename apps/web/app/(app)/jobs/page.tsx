'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Plus, Briefcase, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Sheet } from '@/components/ui/Sheet';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters, type Filters } from '@/components/jobs/JobFilters';
import { useAuth } from '@/hooks/useAuth';
import type { Job } from '@work/types';

const DEFAULT: Filters = { type: [], experience: [], remote: false, region: [], skills: [] };

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const params = useMemo(() => ({
    q: q || undefined,
    type: filters.type.join(',') || undefined,
    experience: filters.experience.join(',') || undefined,
    remote: filters.remote ? 'true' : undefined,
    region: filters.region.join(',') || undefined,
    skills: filters.skills.join(',') || undefined,
    salaryMin: filters.salaryMin
  }), [q, filters]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<
    { items: Job[]; cursor?: string }, Error, { pages: { items: Job[]; cursor?: string }[]; pageParams: unknown[] },
    [string, typeof params], string | undefined
  >({
    queryKey: ['jobs', params],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const r = await api.get('/jobs', { params: { ...params, cursor: pageParam } });
      return { items: r.data.data, cursor: r.data.meta?.cursor };
    },
    getNextPageParam: (last) => last.cursor
  });

  const { data: facets } = useQuery({
    queryKey: ['jobs', 'facets', params],
    queryFn: async () => (await api.get('/jobs/facets', { params })).data.data
  });

  useEffect(() => {
    if (!sentinel.current || !hasNextPage) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && fetchNextPage(), { rootMargin: '600px 0px' });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const jobs = data?.pages.flatMap((p) => p.items) ?? [];
  const isRecruiter = user?.role === 'recruiter' || user?.role === 'company';

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-tighter">Jobs</h1>
          <p className="text-sm text-muted mt-1">
            {facets ? `${facets.total.toLocaleString()} open roles` : 'Loading…'} · {facets?.remote ?? 0} remote
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs/saved">
            <Button variant="glass" size="sm"><Bookmark size={14} /> Saved</Button>
          </Link>
          <Link href="/jobs/applications">
            <Button variant="glass" size="sm"><Briefcase size={14} /> My applications</Button>
          </Link>
          {isRecruiter && (
            <Button variant="accent" magnetic size="sm" onClick={() => router.push('/jobs/new')}>
              <Plus size={14} /> Post a job
            </Button>
          )}
        </div>
      </header>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input variant="glass" leading={<Search size={16} />}
            placeholder="Search jobs, companies, skills…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="glass" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={14} /> Filters
        </Button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <div className="hidden lg:block">
          <JobFilters filters={filters} facets={facets} onChange={setFilters} />
        </div>

        <div className="space-y-3 min-w-0">
          {isLoading && (
            <div className="grid place-items-center py-10"><Spinner /></div>
          )}
          {!isLoading && jobs.length === 0 && (
            <div className="glass rounded-2xl py-16 text-center">
              <p className="font-medium">No jobs match these filters.</p>
              <p className="text-sm text-muted mt-1">Try clearing some filters or broadening your search.</p>
            </div>
          )}

          <motion.div layout className="space-y-3">
            {jobs.map((j) => (
              <JobCard key={j._id} job={j} onClick={() => router.push(`/jobs/${j._id}`)} />
            ))}
          </motion.div>

          <div ref={sentinel} />
          {isFetchingNextPage && <div className="grid place-items-center py-4"><Spinner size={18} /></div>}
          {!hasNextPage && jobs.length > 0 && (
            <p className="text-center text-2xs text-muted py-6">End of results · {jobs.length} jobs</p>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filters" side="left">
        <div className="p-1">
          <JobFilters filters={filters} facets={facets} onChange={setFilters} />
        </div>
      </Sheet>
    </div>
  );
}
