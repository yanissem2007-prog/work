'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Frown } from 'lucide-react';
import type { Post } from '@work/types';
import { api } from '@/lib/api';
import { PostCard } from '@/components/feed/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function PostPermalinkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<Post>({
    queryKey: ['post', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/posts/${id}`)).data.data
  });

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4
                         glass-frost border-b border-border flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-surface transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg tracking-tight">Post</h1>
      </header>

      {isLoading && (
        <div className="grid place-items-center py-16"><Spinner /></div>
      )}

      {isError && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="mx-auto size-12 rounded-2xl bg-surface-2 grid place-items-center mb-4">
            <Frown size={22} className="text-muted" />
          </div>
          <p className="font-display text-xl tracking-tight">Post not found</p>
          <p className="mt-1 text-sm text-muted">It may have been deleted or made private.</p>
          <Button variant="accent" className="mt-5" asChild>
            <a href="/home">Back to home</a>
          </Button>
        </div>
      )}

      {data && <PostCard post={data} />}
    </div>
  );
}
