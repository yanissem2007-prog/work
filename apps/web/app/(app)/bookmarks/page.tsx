'use client';
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import type { Post } from '@work/types';
import { api } from '@/lib/api';
import { PostCard } from '@/components/feed/PostCard';
import { Spinner } from '@/components/ui/Spinner';

export default function BookmarksPage() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => (await api.get('/posts/bookmarks')).data.data
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl tracking-tighter">Bookmarks</h1>
        <p className="text-sm text-muted mt-1">Posts you saved for later.</p>
      </header>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!isLoading && posts.length === 0 && (
        <div className="glass rounded-2xl py-16 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-surface-2 grid place-items-center">
            <Bookmark size={20} className="text-muted" />
          </div>
          <p className="mt-4 font-medium">Nothing saved yet</p>
          <p className="text-sm text-muted mt-1">Tap the bookmark icon on any post to save it here.</p>
        </div>
      )}
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}
