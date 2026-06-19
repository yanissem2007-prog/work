'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal, BadgeCheck, Eye } from 'lucide-react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Post } from '@work/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { cn, formatRelative, formatFull, formatCompact } from '@/lib/utils';
import { RichText } from './RichText';
import { CommentThread } from './CommentThread';

interface Props { post: Post }

// Roles that earn the verified mark.
const VERIFIED_ROLES = new Set(['recruiter', 'company', 'university', 'admin']);

export function PostCard({ post }: Props) {
  const qc = useQueryClient();
  const [openComments, setOpenComments] = useState(false);

  // Local optimistic mirror. The card renders from two different caches
  // (/home → ['home-feed'] nested shape, /feed → ['feed'] flat shape), so we
  // keep authoritative UI state here and patch both caches best-effort.
  const [liked, setLiked] = useState(!!post.viewer?.liked);
  const [bookmarked, setBookmarked] = useState(!!post.viewer?.bookmarked);
  const [reposted, setReposted] = useState(!!(post.viewer as any)?.reposted);
  const [likes, setLikes] = useState(post.stats?.likes ?? 0);
  const [reposts, setReposts] = useState(post.stats?.reposts ?? 0);
  const [busyRepost, setBusyRepost] = useState(false);

  const verified = VERIFIED_ROLES.has(post.author.role as string);

  async function toggleLike() {
    const prevLiked = liked;
    const prevLikes = likes;
    const next = !prevLiked;
    setLiked(next);
    setLikes(prevLikes + (next ? 1 : -1));
    patchCaches(qc, post.id, (p) => ({
      ...p,
      viewer: { liked: next, bookmarked: !!p.viewer?.bookmarked },
      stats: { ...p.stats, likes: Math.max(0, (p.stats.likes ?? 0) + (next ? 1 : -1)) }
    }));
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
      patchCaches(qc, post.id, (p) => ({
        ...p,
        viewer: { liked: prevLiked, bookmarked: !!p.viewer?.bookmarked },
        stats: { ...p.stats, likes: prevLikes }
      }));
      toast.error('Could not update like');
    }
  }

  async function toggleBookmark() {
    const prev = bookmarked;
    const next = !prev;
    setBookmarked(next);
    patchCaches(qc, post.id, (p) => ({ ...p, viewer: { liked: !!p.viewer?.liked, bookmarked: next } }));
    try {
      await api.post(`/posts/${post.id}/bookmark`);
      toast.success(next ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      setBookmarked(prev);
      patchCaches(qc, post.id, (p) => ({ ...p, viewer: { liked: !!p.viewer?.liked, bookmarked: prev } }));
      toast.error('Could not update bookmark');
    }
  }

  // Repost is one-way on the API (it creates a repost; there is no un-repost),
  // so we present it as a single confirming action rather than a toggle.
  async function repost() {
    if (busyRepost || reposted) return;
    setBusyRepost(true);
    setReposted(true);
    setReposts((n) => n + 1);
    try {
      await api.post(`/posts/${post.id}/repost`);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['home-feed'] });
      toast.success('Reposted to your network');
    } catch {
      setReposted(false);
      setReposts((n) => Math.max(0, n - 1));
      toast.error('Could not repost');
    } finally {
      setBusyRepost(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/p/${post.id}`;
    const data = { title: `${post.author.name} on WORK`, text: post.content.slice(0, 120), url };
    try {
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* user dismissed the share sheet — not an error */
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative glass rounded-2xl p-5 transition-colors hover:bg-bg-elev/60
                 before:absolute before:inset-y-5 before:left-0 before:w-px before:-translate-x-[1px]
                 before:bg-grad-accent before:opacity-0 before:transition-opacity before:duration-300
                 hover:before:opacity-60"
    >
      <header className="flex items-center gap-3">
        <Link href={`/profile/${post.author.handle}`} className="shrink-0">
          <Avatar src={post.author.avatar} name={post.author.name} ring />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${post.author.handle}`}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-2 w-fit"
          >
            <span className="truncate">{post.author.name}</span>
            {verified && <BadgeCheck size={14} className="text-accent shrink-0" aria-label="Verified" />}
          </Link>
          <p className="text-xs text-muted truncate">
            <span>@{post.author.handle}</span>
            {post.author.headline && <span className="text-muted-2"> · {post.author.headline}</span>}
            {' · '}
            <time dateTime={new Date(post.createdAt).toISOString()} title={formatFull(post.createdAt)}>
              {formatRelative(post.createdAt)}
            </time>
          </p>
        </div>
        <button
          aria-label="Post options"
          className="text-muted hover:text-fg p-1.5 rounded-lg hover:bg-surface transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
      </header>

      <RichText
        text={post.content}
        className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
      />

      {post.media && post.media.length > 0 && <MediaGrid media={post.media} />}

      {post.repostOf && (
        <Link href={`/p/${post.repostOf.id}`} className="mt-3 block">
          <div className="border border-border rounded-xl p-3 hover:bg-surface transition-colors">
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
          {post.tags.map((t) => (
            <Link key={t} href={`/search?q=${encodeURIComponent('#' + t)}`}>
              <Badge variant="soft">#{t}</Badge>
            </Link>
          ))}
        </div>
      )}

      <footer className="mt-4 -mx-1 flex items-center justify-between text-muted">
        <Action
          icon={<Heart size={17} className={cn(liked && 'fill-current text-danger')} />}
          label={formatCompact(likes)}
          ariaLabel={liked ? 'Unlike' : 'Like'}
          pressed={liked}
          active={liked}
          tone="danger"
          onClick={toggleLike}
        />
        <Action
          icon={<MessageCircle size={17} className={cn(openComments && 'text-info')} />}
          label={formatCompact(post.stats?.comments ?? 0)}
          ariaLabel="Comments"
          pressed={openComments}
          active={openComments}
          tone="info"
          onClick={() => setOpenComments((v) => !v)}
        />
        <Action
          icon={<Repeat2 size={17} className={cn(reposted && 'text-success')} />}
          label={formatCompact(reposts)}
          ariaLabel={reposted ? 'Reposted' : 'Repost'}
          pressed={reposted}
          active={reposted}
          tone="success"
          onClick={repost}
        />
        <Action
          icon={<Bookmark size={17} className={cn(bookmarked && 'fill-current text-accent')} />}
          ariaLabel={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          pressed={bookmarked}
          active={bookmarked}
          tone="accent"
          onClick={toggleBookmark}
        />
        <Action icon={<Share2 size={17} />} ariaLabel="Share" tone="accent" onClick={share} />

        {(post.stats?.views ?? 0) > 0 && (
          <span className="ml-auto hidden xs:flex items-center gap-1 px-2 text-2xs text-muted-2 tabular-nums">
            <Eye size={13} /> {formatCompact(post.stats.views)}
          </span>
        )}
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

const TONE_HOVER: Record<string, string> = {
  danger: 'hover:text-danger hover:bg-danger/10',
  info: 'hover:text-info hover:bg-info/10',
  success: 'hover:text-success hover:bg-success/10',
  accent: 'hover:text-accent hover:bg-accent/10'
};
const TONE_TEXT: Record<string, string> = {
  danger: 'text-danger',
  info: 'text-info',
  success: 'text-success',
  accent: 'text-accent'
};

function Action({
  icon, label, onClick, active, pressed, ariaLabel, tone = 'accent'
}: {
  icon: React.ReactNode;
  label?: number | string;
  onClick?: () => void;
  active?: boolean;
  pressed?: boolean;
  ariaLabel: string;
  tone?: 'danger' | 'info' | 'success' | 'accent';
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      title={ariaLabel}
      className={cn(
        'group/btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill transition-colors duration-fast',
        TONE_HOVER[tone],
        active && TONE_TEXT[tone]
      )}
    >
      <span className="inline-flex relative">
        {icon}
        {active && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('absolute inset-0 rounded-full', TONE_TEXT[tone])}
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
  const cols = media.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
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

/**
 * Patch a post inside BOTH feed caches:
 *   ['feed']       → pages[].items: Post[]            (flat, chronological feed)
 *   ['home-feed']  → pages[].items: { kind, data }[]  (mixed home feed)
 * Best-effort, shape-tolerant — silently skips caches not yet populated.
 */
function patchCaches(qc: QueryClient, id: string, fn: (p: Post) => Post) {
  qc.setQueriesData<{ pages: { items: Post[] }[] }>({ queryKey: ['feed'] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((pg) => ({
        ...pg,
        items: pg.items.map((p) => (p.id === id ? fn(p) : p))
      }))
    };
  });

  qc.setQueriesData<{ pages: { items: { kind: string; data: Post }[] }[] }>(
    { queryKey: ['home-feed'] },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((pg) => ({
          ...pg,
          items: pg.items.map((it) =>
            it.kind === 'post' && it.data?.id === id ? { ...it, data: fn(it.data) } : it
          )
        }))
      };
    }
  );
}
