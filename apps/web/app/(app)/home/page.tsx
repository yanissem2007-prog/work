'use client';
import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Compass, Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/feed/PostCard';
import { PostComposer } from '@/components/feed/PostComposer';
import { JobRecCard, PeopleCard, CommunitiesCard, CourseCard } from '@/components/home/HomeCards';

type HomeItem =
  | { kind: 'post'; data: any }
  | { kind: 'job'; data: any }
  | { kind: 'people'; data: { users: any[] } }
  | { kind: 'communities'; data: { communities: any[] } }
  | { kind: 'course'; data: any };

interface Page { items: HomeItem[]; cursor?: string }

export default function HomePage() {
  const sentinel = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<Page, Error, { pages: Page[]; pageParams: unknown[] }, [string], string | undefined>({
      queryKey: ['home-feed'],
      initialPageParam: undefined,
      queryFn: async ({ pageParam }) => {
        const r = await api.get('/home/feed', { params: { cursor: pageParam } });
        return { items: r.data.data as HomeItem[], cursor: r.data.meta?.cursor };
      },
      getNextPageParam: (last) => last.cursor
    });

  useEffect(() => {
    if (!sentinel.current || !hasNextPage) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) fetchNextPage(); },
      { rootMargin: '700px 0px' });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const items: HomeItem[] = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        {/* Welcome card */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl glass-strong overflow-hidden p-6 sm:p-7"
        >
          <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-40" />
          <div className="absolute inset-0 -z-10 noise opacity-30" />
          <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
            <Sparkles size={11} /> Your home
          </div>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl tracking-tightest">
            Tailored to <span className="gradient-text italic">you</span>.
          </h1>
          <p className="mt-1 text-sm text-muted">
            Posts from people and communities you follow, jobs that match your skills, and ideas to grow.
          </p>
        </motion.section>

        <PostComposer />

        {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}

        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.div
              key={keyOf(item, i)}
              layout
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.02, 0.25), ease: [0.16, 1, 0.3, 1] }}
            >
              {renderItem(item)}
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={sentinel} />
        {isFetchingNextPage && (
          <div className="grid place-items-center py-6"><Spinner size={20} /></div>
        )}
        {!hasNextPage && items.length > 0 && (
          <p className="text-center text-2xs text-muted py-6">End of feed · {items.length} cards</p>
        )}
      </div>

      {/* Sticky right rail */}
      <aside className="hidden lg:flex flex-col gap-3 sticky top-4 h-fit">
        <Link href="/trending">
          <Card variant="glass" interactive className="!p-4 hover-lift">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-[oklch(70%_0.24_340)] to-[var(--accent)] shadow-glow grid place-items-center">
                <Flame size={14} className="text-accent-fg" />
              </div>
              <div>
                <p className="text-sm font-medium">What's trending</p>
                <p className="text-2xs text-muted">Jobs, skills, communities</p>
              </div>
              <TrendingUp size={14} className="ml-auto text-muted" />
            </div>
          </Card>
        </Link>
        <Link href="/matches">
          <Card variant="glass" interactive className="!p-4 hover-lift">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-[oklch(78%_0.18_200)] to-[var(--accent)] shadow-glow grid place-items-center">
                <Sparkles size={14} className="text-accent-fg" />
              </div>
              <div>
                <p className="text-sm font-medium">Your matches</p>
                <p className="text-2xs text-muted">Jobs picked for you</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/roadmap">
          <Card variant="glass" interactive className="!p-4 hover-lift">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-[oklch(78%_0.22_142)] to-[var(--accent)] shadow-glow grid place-items-center">
                <Compass size={14} className="text-accent-fg" />
              </div>
              <div>
                <p className="text-sm font-medium">Build a roadmap</p>
                <p className="text-2xs text-muted">AI plots your route</p>
              </div>
            </div>
          </Card>
        </Link>
        <Button variant="ghost" asChild className="text-xs justify-start">
          <Link href="/feed">Switch to chronological feed →</Link>
        </Button>
      </aside>
    </div>
  );
}

function keyOf(item: HomeItem, i: number): string {
  if (item.kind === 'post') return `p-${item.data.id}`;
  if (item.kind === 'job') return `j-${item.data.jobId ?? item.data.job?._id ?? i}`;
  return `${item.kind}-${i}`;
}

function renderItem(item: HomeItem) {
  switch (item.kind) {
    case 'post': return <PostCard post={item.data} />;
    case 'job': return <JobRecCard data={item.data} />;
    case 'people': return <PeopleCard users={item.data.users} />;
    case 'communities': return <CommunitiesCard communities={item.data.communities} />;
    case 'course': return <CourseCard data={item.data} />;
  }
}
