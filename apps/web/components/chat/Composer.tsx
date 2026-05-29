'use client';
import { useRef, useState, useEffect } from 'react';
import { Paperclip, ImagePlus, Send, Smile, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { cn } from '@/lib/utils';

interface Attachment {
  url: string; type: 'image' | 'video' | 'file';
  name?: string; size?: number; mime?: string;
}

interface Props {
  roomId: string;
  onSend: () => void;
}

export function Composer({ roomId, onSend }: Props) {
  const socket = useSocket();
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const typingRef = useRef<{ active: boolean; timer?: NodeJS.Timeout }>({ active: false });

  // Auto-resize
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [content]);

  // Typing indicator broadcasting
  useEffect(() => { return () => {
    if (typingRef.current.active) socket?.emit('chat:typing', { roomId, typing: false });
  }; }, [roomId, socket]);

  function onChange(v: string) {
    setContent(v);
    if (!socket) return;
    if (!typingRef.current.active) {
      typingRef.current.active = true;
      socket.emit('chat:typing', { roomId, typing: true });
    }
    clearTimeout(typingRef.current.timer);
    typingRef.current.timer = setTimeout(() => {
      typingRef.current.active = false;
      socket.emit('chat:typing', { roomId, typing: false });
    }, 1800);
  }

  async function uploadFiles(files: FileList | null, asImage: boolean) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data: sig } = await api.post('/media/sign', { folder: `chat/${roomId}` });
      const s = sig.data;
      const next: Attachment[] = [];
      for (const file of Array.from(files).slice(0, 6 - attachments.length)) {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', s.apiKey);
        form.append('timestamp', String(s.timestamp));
        form.append('signature', s.signature);
        form.append('folder', s.folder);
        const r = await fetch(s.uploadUrl, { method: 'POST', body: form });
        const j = await r.json();
        if (!j.secure_url) continue;
        const type: Attachment['type'] = asImage
          ? (file.type.startsWith('video') ? 'video' : 'image')
          : file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
        next.push({
          url: j.secure_url, type,
          name: file.name, size: file.size, mime: file.type
        });
      }
      setAttachments((a) => [...a, ...next]);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function send() {
    const text = content.trim();
    if (!text && attachments.length === 0) return;
    try {
      await api.post(`/chat/rooms/${roomId}/messages`, { content: text, attachments });
      setContent(''); setAttachments([]);
      if (typingRef.current.active) {
        typingRef.current.active = false;
        socket?.emit('chat:typing', { roomId, typing: false });
      }
      onSend();
    } catch { toast.error('Send failed'); }
  }

  return (
    <div className="border-t border-border p-3">
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-2 flex gap-2 flex-wrap"
          >
            {attachments.map((a, i) => (
              <div key={i} className="relative group">
                {a.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" className="size-16 rounded-lg object-cover" />
                ) : (
                  <div className="size-16 rounded-lg bg-surface-2 grid place-items-center text-2xs px-1 text-center">
                    {a.name?.split('.').pop()?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => setAttachments((arr) => arr.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 size-5 grid place-items-center rounded-full bg-black/70 text-white"
                ><X size={10} /></button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <input ref={imgRef} type="file" multiple accept="image/*,video/*" className="hidden"
          onChange={(e) => uploadFiles(e.target.files, true)} />
        <input ref={fileRef} type="file" multiple className="hidden"
          onChange={(e) => uploadFiles(e.target.files, false)} />

        <IconBtn onClick={() => imgRef.current?.click()} disabled={uploading}
          aria-label="Attach image">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </IconBtn>
        <IconBtn onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach file">
          <Paperclip size={16} />
        </IconBtn>

        <div className="flex-1 glass rounded-2xl px-3 py-1.5 flex items-end gap-2">
          <textarea
            ref={taRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Write a message…"
            className="flex-1 bg-transparent resize-none outline-none text-sm py-1.5 max-h-40"
          />
          <button className="text-muted hover:text-fg p-1" aria-label="Emoji">
            <Smile size={16} />
          </button>
        </div>

        <button
          onClick={send}
          disabled={!content.trim() && attachments.length === 0}
          className={cn(
            'size-10 grid place-items-center rounded-full bg-grad-accent text-accent-fg shadow-glow transition',
            'hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100'
          )}
          aria-label="Send"
        ><Send size={16} /></button>
      </div>
    </div>
  );
}

function IconBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props}
      className="size-10 grid place-items-center rounded-full text-muted hover:text-accent hover:bg-surface disabled:opacity-40 transition" />
  );
}
