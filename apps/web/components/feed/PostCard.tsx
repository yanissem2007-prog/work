'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Post } from '@work/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';
import { CommentThread } from './CommentThread';

interface Props { post: Post }

export function PostCard({ post }: Props) {
  const [openComments, setOpenComments] = useState(false);
  const qc = useQueryClient();

  const likeMut = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onMutate: async () => {
      const liked = !post.viewer?.liked;
      patchFeed(qc, post.id, (p) => ({
        ...p,
        viewer: { ...p.viewer!, liked },
        stats: { ...p.stats, likes: p.stats.likes + (liked ? 1 : -1) }
      }));
    }
  });

  const bookmarkMut = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/bookmark`),
    onMutate: async () => {
      const bookmarked = !post.viewer?.bookmarked;
      patchFeed(qc, post.id, (p) => ({ ...p, viewer: { ...p.viewer!, bookmarked } }));
    }
  });

  const repostMut = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/repost`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] })
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative glass rounded-2xl p-5 hover:bg-bg-elev/60 transition-colors"
    >
      <header className="flex items-center gap-3">
        <Link href={`/profile/${post.author.handle}`}><Avatar src={post.author.avatar} name={post.author.name} ring /></Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.author.handle}`} className="flex items-center gap-1.5 text-sm font-medium hover:underline">
            {post.author.name}
            {post.author.role === 'recruiter' && <CheckCircle2 size={13} className="text-accent" />}
          </Link>
          <p className="text-xs text-muted truncate">
            @{post.author.handle} · {post.author.headline ?? ''} · {formatRelative(post.createdAt)}
          </p>
        </div>
        <button aria-label="More" className="text-muted hover:text-fg p-1.5 rounded-lg hover:bg-surface">
          <MoreHorizontal size={16} />
        </button>
      </header>

      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && <MediaGrid media={post.media} />}

      {post.repostOf && (
        <Link href={`/p/${post.repostOf.id}`} className="mt-3 block">
          <div className="border border-border rounded-xl p-3 hover:bg-surface transition">
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar src={post.repostOf.author.avatar} name={post.repostOf.author.name} size="xs" />
              <p className="text-xs text-muted">
                <span className="text-fg font-medium">{post.repostOf.author.name}</span> · {formatRelative(post.repostOf.createdAt)}
              </p>
            </div>
            <p className="text-sm line-clamp-3">{post.repostOf.content}</p>
          </div>
        </Link>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => <Badge key={t} variant="soft">#{t}</Badge>)}
        </div>
      )}

      <footer className="mt-4 -mx-1 flex items-center justify-between text-muted">
        <Action
          icon={<Heart size={17} className={cn(post.viewer?.liked && 'fill-current text-danger')} />}
          label={post.stats.likes}
          active={post.viewer?.liked}
          activeColor="text-danger"
          onClick={() => likeMut.mutate()}
        />
        <Action
          icon={<MessageCircle size={17} />}
          label={post.stats.comments}
          onClick={() => setOpenComments((v) => !v)}
        />
        <Action
          icon={<Repeat2 size={17} className={cn(repostMut.isSuccess && 'text-success')} />}
          label={post.stats.reposts}
          onClick={() => repostMut.mutate()}
          activeColor="text-success"
        />
        <Action
          icon={<Bookmark size={17} className={cn(post.viewer?.bookmarked && 'fill-current')} />}
          onClick={() => bookmarkMut.mutate()}
          active={post.viewer?.bookmarked}
          activeColor="text-accent"
        />
        <Action icon={<Share2 size={17} />} />
      </footer>

      <AnimatePresence>
        {openComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <CommentThread postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Action({
  icon, label, onClick, active, activeColor = 'text-fg'
}: {
  icon: React.ReactNode; label?: number | string; onClick?: () => void;
  active?: boolean; activeColor?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        'group/btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill transition-colors duration-fast',
        'hover:bg-surface hover:text-fg',
        active && activeColor
      )}
    >
      <span className="inline-flex relative">
        {icon}
        {active && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('absolute inset-0 rounded-full', activeColor)}
            style={{ background: 'currentColor' }}
          />
        )}
      </span>
      {label !== undefined && <span className="text-xs tabular-nums">{label}</span>}
    </motion.button>
  );
}

function MediaGrid({ media }: { media: Post['media'] }) {
  if (!media?.length) return null;
  const cols = media.length === 1 ? 'grid-cols-1' : media.length === 2 ? 'grid-cols-2' : 'grid-cols-2';
  return (
    <div className={cn('mt-3 grid gap-1.5 rounded-xl overflow-hidden', cols)}>
      {media.slice(0, 4).map((m, i) => (
        <div key={i} className={cn('relative bg-surface', media.length === 3 && i === 0 && 'row-span-2')}>
          {m.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt="" className="w-full h-full object-cover aspect-[4/3]" loading="lazy" />
          ) : (
            <video src={m.url} controls className="w-full h-full object-cover aspect-[4/3]" />
          )}
        </div>
      ))}
    </div>
  );
}

function patchFeed(qc: ReturnType<typeof useQueryClient>, id: string, fn: (p: Post) => Post) {
  qc.setQueriesData<{ pages: { items: Post[] }[] }>(
    { queryKey: ['feed'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((pg) => ({
          ...pg,
          items: pg.items.map((p) => (p.id === id ? fn(p) : p))
        }))
      };
    }
  );
}
