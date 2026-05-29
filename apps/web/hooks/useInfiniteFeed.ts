'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Post } from '@work/types';

type Scope = 'home' | 'trending' | 'following';

interface Page { items: Post[]; cursor?: string }

export function useInfiniteFeed(scope: Scope = 'home') {
  return useInfiniteQuery<Page, Error, { pages: Page[]; pageParams: unknown[] }, [string, Scope], string | undefined>({
    queryKey: ['feed', scope],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const r = await api.get('/posts/feed', { params: { scope, cursor: pageParam } });
      return { items: r.data.data as Post[], cursor: r.data.meta?.cursor as string | undefined };
    },
    getNextPageParam: (last) => last.cursor
  });
}
