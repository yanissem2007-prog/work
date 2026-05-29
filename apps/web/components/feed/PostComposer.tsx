'use client';
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Smile, Globe2, Users2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface Media { url: string; type: 'image' | 'video' }

export function PostComposer() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'connections'>('public');
  const [uploading, setUploading] = useState(false);

  const send = useMutation({
    mutationFn: async () => (await api.post('/posts', { content, media, visibility })).data,
    onSuccess: () => {
      setContent(''); setMedia([]);
      qc.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Posted');
    }
  });

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
    } catch (e) {
      toast.error('Upload failed');
    } finally { setUploading(false); }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex gap-3">
        <Avatar src={user?.avatar} name={user?.name ?? 'You'} ring />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with your network…"
            rows={2}
            className="w-full bg-transparent resize-none outline-none text-[15px] placeholder:text-muted min-h-[60px]"
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
                      className="absolute top-1 right-1 size-6 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
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
              <IconBtn aria-label="Add media" disabled={uploading || media.length >= 4} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              </IconBtn>
              <IconBtn aria-label="Emoji"><Smile size={16} /></IconBtn>
              <button
                onClick={() => setVisibility((v) => v === 'public' ? 'connections' : 'public')}
                className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg px-2.5 py-1 rounded-pill border border-border"
              >
                {visibility === 'public' ? <Globe2 size={12} /> : <Users2 size={12} />}
                {visibility === 'public' ? 'Anyone' : 'Connections'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-2xs tabular-nums', content.length > 3800 ? 'text-danger' : 'text-muted')}>
                {content.length} / 4000
              </span>
              <Button
                size="sm" variant="accent" magnetic
                loading={send.isPending}
                disabled={!content.trim() || content.length > 4000}
                onClick={() => send.mutate()}
              >Post</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="p-2 rounded-lg text-muted hover:text-accent hover:bg-surface disabled:opacity-40 transition">
      {children}
    </button>
  );
}
