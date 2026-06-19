'use client';
import { useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Globe2, Users2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface Media { url: string; type: 'image' | 'video' }

const MAX = 4000;
const NEAR_LIMIT = MAX - 200;

export function PostComposer() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'connections'>('public');
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);

  const send = useMutation({
    mutationFn: async () => (await api.post('/posts', { content: content.trim(), media, visibility })).data,
    onSuccess: () => {
      setContent('');
      setMedia([]);
      if (taRef.current) taRef.current.style.height = 'auto';
      // Refresh both feed caches — /home reads ['home-feed'], /feed reads ['feed'].
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['home-feed'] });
      toast.success('Posted to your network');
    },
    onError: () => toast.error('Could not publish your post')
  });

  // Auto-grow the textarea to fit its content (capped by max-height in CSS).
  const autoGrow = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, []);

  const canPost = !!content.trim() && content.length <= MAX && !send.isPending;

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPost) {
      e.preventDefault();
      send.mutate();
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data: sig } = await api.post('/media/sign', { folder: 'posts' });
      const sigData = sig.data;
      const uploaded: Media[] = [];
      for (const file of Array.from(files).slice(0, 4 - media.length)) {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sigData.apiKey);
        form.append('timestamp', String(sigData.timestamp));
        form.append('signature', sigData.signature);
        form.append('folder', sigData.folder);
        const r = await fetch(sigData.uploadUrl, { method: 'POST', body: form });
        const j = await r.json();
        if (j.secure_url) {
          uploaded.push({ url: j.secure_url, type: file.type.startsWith('video') ? 'video' : 'image' });
        }
      }
      setMedia((m) => [...m, ...uploaded]);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const pct = Math.min(content.length / MAX, 1);
  const over = content.length > MAX;

  return (
    <div
      className={cn(
        'rounded-2xl p-4 transition-shadow duration-normal',
        focused ? 'glass-strong shadow-glow' : 'glass'
      )}
    >
      <div className="flex gap-3">
        <Avatar src={user?.avatar} name={user?.name ?? 'You'} ring />
        <div className="flex-1 min-w-0">
          <textarea
            ref={taRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); autoGrow(); }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Share something with your network…"
            rows={1}
            className="w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed placeholder:text-muted min-h-[44px]"
          />

          {media.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <AnimatePresence>
                {media.map((m, i) => (
                  <motion.div
                    key={m.url}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="relative rounded-xl overflow-hidden"
                  >
                    {m.type === 'image'
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={m.url} alt="" className="w-full h-32 object-cover" />
                      : <video src={m.url} className="w-full h-32 object-cover" />}
                    <button
                      onClick={() => setMedia((arr) => arr.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 size-6 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      aria-label="Remove media"
                    ><X size={12} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" multiple accept="image/*,video/*"
                className="hidden" onChange={(e) => onFiles(e.target.files)} />
              <IconBtn
                aria-label="Add photo or video"
                disabled={uploading || media.length >= 4}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              </IconBtn>
              <button
                onClick={() => setVisibility((v) => (v === 'public' ? 'connections' : 'public'))}
                className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg px-2.5 py-1 rounded-pill border border-border hover:border-border-strong transition-colors"
              >
                {visibility === 'public' ? <Globe2 size={12} /> : <Users2 size={12} />}
                {visibility === 'public' ? 'Anyone' : 'Connections'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {content.length > 0 && <CharRing pct={pct} over={over} remaining={MAX - content.length} />}
              <Button
                size="sm" variant="accent" magnetic
                loading={send.isPending}
                disabled={!canPost}
                onClick={() => send.mutate()}
              >Post</Button>
            </div>
          </div>

          {focused && (
            <p className="mt-2 text-2xs text-muted-2 select-none">
              <kbd className="font-mono">⌘</kbd>+<kbd className="font-mono">Enter</kbd> to post
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Twitter-style circular character meter; flips to a countdown near the limit. */
function CharRing({ pct, over, remaining }: { pct: number; over: boolean; remaining: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const showCount = remaining <= 200;
  const stroke = over ? 'var(--danger)' : remaining <= 200 ? 'var(--warning)' : 'var(--accent)';
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden={!showCount}>
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
        <circle
          cx="12" cy="12" r={r} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 1))}
          style={{ transition: 'stroke-dashoffset 200ms ease, stroke 200ms ease' }}
        />
      </svg>
      {showCount && (
        <span className={cn('text-2xs tabular-nums', over ? 'text-danger' : 'text-warning')}>
          {remaining}
        </span>
      )}
    </span>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="p-2 rounded-lg text-muted hover:text-accent hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );
}
