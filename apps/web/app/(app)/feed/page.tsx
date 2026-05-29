'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Flame, Home, UserPlus2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { useSocket } from '@/providers/SocketProvider';
import { PostCard } from '@/components/feed/PostCard';
import { PostComposer } from '@/components/feed/PostComposer';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Post, User } from '@work/types';

type Scope = 'home' | 'trending' | 'following';

const TABS: { id: Scope; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'home', label: 'For you', icon: Home },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'following', label: 'Following', icon: UserPlus2 }
];

export default function FeedPage() {
  const [scope, setScope] = useState<Scope>('home');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteFeed(scope);
  const sentinel = useRef<HTMLDivElement>(null);
  const [newCount, setNewCount] = useState(0);
  const qc = useQueryClient();
  const socket = useSocket();

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinel.current || !hasNextPage) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage();
    }, { rootMargin: '600px 0px' });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Real-time: count incoming posts
  useEffect(() => {
    if (!socket) return;
    const onNew = () => setNewCount((c) => c + 1);
    socket.on('post:new', onNew);
    return () => { socket.off('post:new', onNew); };
  }, [socket]);

  function loadNew() {
    setNewCount(0);
    qc.invalidateQueries({ queryKey: ['feed', scope] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4 relative">
        {/* Tabs */}
        <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 backdrop-blur-md bg-bg/70 border-b border-border">
          <div className="flex gap-1 py-2">
            {TABS.map((t) => {
              const active = scope === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setScope(t.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-pill text-sm transition',
                    active ? 'text-fg' : 'text-muted hover:text-fg'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="feed-tab"
                      className="absolute inset-0 rounded-pill bg-surface-2 border border-border"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <t.icon size={14} />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {newCount > 0 && (
            <motion.button
              initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
              onClick={loadNew}
              className="sticky top-14 z-10 mx-auto block glass-strong rounded-pill px-4 py-2 text-xs font-medium shadow-glow"
            >
              ↑ {newCount} new {newCount === 1 ? 'post' : 'posts'}
            </motion.button>
          )}
        </AnimatePresence>

        <PostComposer />

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <FeedSkeleton key={i} />)}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </AnimatePresence>

        <div ref={sentinel} />
        {isFetchingNextPage && (
          <div className="grid place-items-center py-6"><Spinner size={20} /></div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-center text-2xs text-muted py-6">You're all caught up · {posts.length} posts</p>
        )}
      </div>

      <aside className="hidden lg:flex flex-col gap-4 sticky top-4 h-fit">
        <TrendingTopics />
        <SuggestedPeople />
      </aside>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function TrendingTopics() {
  const tags = [
    { tag: 'AI', count: '24.1k' }, { tag: 'frontend', count: '18.2k' },
    { tag: 'algeria', count: '9.4k' }, { tag: 'remote', count: '14.7k' }, { tag: 'design', count: '11.3k' }
  ];
  return (
    <Card variant="glass" size="md">
      <CardTitle className="text-base">Trending</CardTitle>
      <CardDescription className="mt-1">What people are talking about</CardDescription>
      <ul className="mt-4 space-y-2">
        {tags.map((t) => (
          <li key={t.tag} className="flex items-center justify-between hover:bg-surface rounded-lg px-2 py-1.5 cursor-pointer">
            <span className="text-sm">#{t.tag}</span>
            <span className="text-2xs text-muted">{t.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SuggestedPeople() {
  const { data } = useQuery<User[]>({
    queryKey: ['suggestions'],
    queryFn: async () => (await api.get('/users/suggestions')).data.data
  });
  const qc = useQueryClient();

  async function follow(id: string) {
    await api.post(`/users/follow/${id}`);
    qc.invalidateQueries({ queryKey: ['suggestions'] });
  }

  return (
    <Card variant="glass" size="md">
      <CardTitle className="text-base">Suggested for you</CardTitle>
      <ul className="mt-4 space-y-3">
        {data?.map((u) => (
          <li key={u.id} className="flex items-center gap-2">
            <Avatar src={u.avatar} name={u.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{u.name}</p>
              <p className="text-2xs text-muted truncate">{u.headline ?? `@${u.handle}`}</p>
            </div>
            <Button size="xs" variant="glass" onClick={() => follow(u.id)}>Follow</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
