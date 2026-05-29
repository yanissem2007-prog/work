'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Hash, Megaphone, BookOpen, Calendar, Send, ImagePlus, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Channel, ChannelMessage, Community } from '@work/types';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { useAuthStore } from '@/stores/authStore';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingDots } from '@/components/chat/TypingDots';
import { Spinner } from '@/components/ui/Spinner';
import { can } from '@/lib/communityPermissions';
import { useChatStore } from '@/stores/chatStore';

const HEADER_ICONS = { text: Hash, announcement: Megaphone, resource: BookOpen, event: Calendar };

interface Props { community: Community; channel: Channel }

export function ChannelView({ community, channel }: Props) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const socket = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const role = community.viewer?.role;

  const readOnly = channel.readOnlyFor?.includes(role ?? 'member') ?? false;
  const muted = community.viewer?.mutedUntil && new Date(community.viewer.mutedUntil) > new Date();
  const cannotSend = readOnly || muted || !can(role, 'message.send');

  const { data: messages = [], isLoading } = useQuery<ChannelMessage[]>({
    queryKey: ['channel', channel._id, 'messages'],
    queryFn: async () =>
      (await api.get(`/communities/${community.slug}/channels/${channel._id}/messages`)).data.data
  });

  useEffect(() => {
    if (!socket) return;
    socket.emit('channel:join', { channelId: channel._id, communityId: community._id });
    const onNew = (m: ChannelMessage) => {
      if (m.channelId !== channel._id) return;
      qc.setQueryData<ChannelMessage[]>(['channel', channel._id, 'messages'],
        (old) => [...(old ?? []), m]);
    };
    const onDel = ({ id }: { id: string }) =>
      qc.setQueryData<ChannelMessage[]>(['channel', channel._id, 'messages'],
        (old) => (old ?? []).filter((m) => m._id !== id));
    const onReact = ({ id, reactions }: { id: string; reactions: ChannelMessage['reactions'] }) =>
      qc.setQueryData<ChannelMessage[]>(['channel', channel._id, 'messages'],
        (old) => (old ?? []).map((m) => m._id === id ? { ...m, reactions } : m));

    socket.on('channel:new', onNew);
    socket.on('channel:deleted', onDel);
    socket.on('channel:reaction', onReact);
    return () => {
      socket.emit('channel:leave', channel._id);
      socket.off('channel:new', onNew);
      socket.off('channel:deleted', onDel);
      socket.off('channel:reaction', onReact);
    };
  }, [socket, channel._id, community._id, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const Icon = HEADER_ICONS[channel.type] ?? Hash;
  const typing = useChatStore((s) => s.typing[channel._id]);
  const typingUsers = typing ? [...typing].filter((id) => id !== me?.id) : [];

  return (
    <section className="flex-1 flex flex-col h-full min-w-0">
      <header className="h-16 px-4 border-b border-border flex items-center gap-3">
        <Icon size={18} className="text-muted" />
        <p className="font-medium">{channel.name}</p>
        {channel.topic && (
          <>
            <span className="h-4 w-px bg-border" />
            <p className="text-xs text-muted truncate">{channel.topic}</p>
          </>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1.5">
        {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
        {!isLoading && messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 text-muted">
            <div className="mx-auto size-16 rounded-2xl bg-grad-accent shadow-glow grid place-items-center mb-3">
              <Icon size={22} className="text-accent-fg" />
            </div>
            <p className="font-medium">Welcome to #{channel.name}</p>
            <p className="text-xs">This is the start of the channel.</p>
          </motion.div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const sameSender = prev && prev.authorId === m.authorId;
          return (
            <MessageBubble
              key={m._id}
              id={m._id}
              content={m.content}
              attachments={m.attachments}
              reactions={m.reactions}
              senderId={m.authorId}
              senderName={m.author?.name}
              senderAvatar={m.author?.avatar}
              createdAt={m.createdAt}
              mine={m.authorId === me?.id}
              showAvatar={!sameSender}
              showName={!sameSender && m.authorId !== me?.id}
              edited={m.edited}
            />
          );
        })}
        {typingUsers.length > 0 && <TypingDots />}
      </div>

      <ChannelComposer
        slug={community.slug}
        channel={channel}
        disabled={!!cannotSend}
        reason={readOnly ? 'Read-only channel' : muted ? 'You are muted' : undefined}
      />
    </section>
  );
}

function ChannelComposer({ slug, channel, disabled, reason }: { slug: string; channel: Channel; disabled?: boolean; reason?: string }) {
  const socket = useSocket();
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; type: 'image' | 'video' | 'file'; name?: string; size?: number; mime?: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [content]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data: s } = await api.post('/media/sign', { folder: `community/${slug}` });
      const sig = s.data; const next: typeof attachments = [];
      for (const f of Array.from(files).slice(0, 4 - attachments.length)) {
        const form = new FormData();
        form.append('file', f); form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature); form.append('folder', sig.folder);
        const r = await fetch(sig.uploadUrl, { method: 'POST', body: form });
        const j = await r.json();
        if (j.secure_url) next.push({
          url: j.secure_url,
          type: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : 'file',
          name: f.name, size: f.size, mime: f.type
        });
      }
      setAttachments((a) => [...a, ...next]);
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  }

  async function send() {
    if (disabled) return;
    if (!content.trim() && attachments.length === 0) return;
    try {
      await api.post(`/communities/${slug}/channels/${channel._id}/messages`, { content: content.trim(), attachments });
      setContent(''); setAttachments([]);
    } catch (e: any) { toast.error(e?.response?.data?.error?.message ?? 'Send failed'); }
  }

  if (disabled) {
    return (
      <div className="border-t border-border p-3 flex items-center gap-2 text-sm text-muted">
        <Lock size={14} /> {reason ?? 'You cannot send messages here.'}
      </div>
    );
  }

  return (
    <div className="border-t border-border p-3">
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {attachments.map((a, i) => (
            <div key={i} className="relative size-14 rounded-lg overflow-hidden">
              {a.type === 'image'
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.url} alt="" className="size-full object-cover" />
                : <div className="size-full grid place-items-center bg-surface-2 text-2xs">{a.mime?.split('/')[1]}</div>}
              <button onClick={() => setAttachments((arr) => arr.filter((_, idx) => idx !== i))}
                className="absolute top-0 right-0 size-5 bg-black/70 text-white text-2xs">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,application/*"
          className="hidden" onChange={(e) => upload(e.target.files)} />
        <button onClick={() => fileRef.current?.click()}
          className="size-10 grid place-items-center rounded-full text-muted hover:text-accent hover:bg-surface disabled:opacity-40"
          disabled={uploading}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </button>
        <div className="flex-1 glass rounded-2xl px-3 py-1.5">
          <textarea
            ref={taRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              socket?.emit('channel:typing', { channelId: channel._id, typing: true });
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={`Message #${channel.name}`}
            className="w-full bg-transparent resize-none outline-none text-sm py-1.5 max-h-40"
          />
        </div>
        <button onClick={send}
          disabled={!content.trim() && attachments.length === 0}
          className="size-10 grid place-items-center rounded-full bg-grad-accent text-accent-fg shadow-glow hover:scale-105 active:scale-95 transition disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
