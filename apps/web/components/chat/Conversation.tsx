'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, Phone, Video, Users2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { TypingDots } from './TypingDots';

interface Member { id: string; name: string; avatar?: string; handle: string }
interface Room {
  id: string; type: 'dm' | 'group' | 'community';
  title: string; avatar?: string; members: Member[]; isAdmin: boolean;
}

interface Message {
  _id: string; content: string; senderId: string; createdAt: string;
  attachments?: { url: string; type: 'image' | 'video' | 'file'; name?: string; size?: number; mime?: string }[];
  reactions?: { emoji: string; userId: string }[];
  edited?: boolean;
}

interface Props { room: Room; onBack: () => void }

export function Conversation({ room, onBack }: Props) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const socket = useSocket();
  const typing = useChatStore((s) => s.typing[room.id]);
  const online = useChatStore((s) => s.online);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, force] = useState(0);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages', room.id],
    queryFn: async () => (await api.get(`/chat/rooms/${room.id}/messages`)).data.data
  });

  // Real-time
  useEffect(() => {
    if (!socket) return;
    const onNew = (m: Message) => {
      if (String(m.senderId) === me?.id) return;
      if (String((m as any).roomId) !== room.id) return;
      qc.setQueryData<Message[]>(['messages', room.id], (old) => [...(old ?? []), m]);
    };
    const onEdit = (p: { id: string; content: string }) =>
      qc.setQueryData<Message[]>(['messages', room.id], (old) =>
        (old ?? []).map((m) => m._id === p.id ? { ...m, content: p.content, edited: true } : m));
    const onDel = (p: { id: string }) =>
      qc.setQueryData<Message[]>(['messages', room.id], (old) =>
        (old ?? []).filter((m) => m._id !== p.id));
    const onReact = (p: { id: string; reactions: Message['reactions'] }) =>
      qc.setQueryData<Message[]>(['messages', room.id], (old) =>
        (old ?? []).map((m) => m._id === p.id ? { ...m, reactions: p.reactions } : m));

    socket.emit('chat:join', room.id);
    socket.on('chat:new', onNew);
    socket.on('chat:edited', onEdit);
    socket.on('chat:deleted', onDel);
    socket.on('chat:reaction', onReact);

    return () => {
      socket.emit('chat:leave', room.id);
      socket.off('chat:new', onNew);
      socket.off('chat:edited', onEdit);
      socket.off('chat:deleted', onDel);
      socket.off('chat:reaction', onReact);
    };
  }, [socket, room.id, qc, me?.id]);

  // Mark read on open
  useEffect(() => { api.post(`/chat/rooms/${room.id}/read`).catch(() => {}); }, [room.id]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const memberMap = new Map(room.members.map((m) => [m.id, m]));
  const otherIds = room.members.filter((m) => m.id !== me?.id).map((m) => m.id);
  const dmOnline = room.type === 'dm' && otherIds.some((id) => online.has(id));
  const typingNames = typing
    ? [...typing].filter((id) => id !== me?.id).map((id) => memberMap.get(id)?.name).filter(Boolean) as string[]
    : [];

  return (
    <section className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 sm:px-4 h-16 border-b border-border">
        <button onClick={onBack} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface">
          <ArrowLeft size={18} />
        </button>
        <div className="relative">
          {room.type === 'group' ? (
            <div className="size-10 rounded-full bg-grad-accent grid place-items-center text-accent-fg shadow-glow">
              <Users2 size={16} />
            </div>
          ) : (
            <Avatar src={room.avatar} name={room.title} status={dmOnline ? 'online' : undefined} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{room.title}</p>
          <p className="text-2xs text-muted">
            {room.type === 'dm'
              ? (dmOnline ? 'Online now' : 'Offline')
              : `${room.members.length} members`}
          </p>
        </div>
        <button className="size-10 rounded-full hover:bg-surface text-muted" aria-label="Call"><Phone size={16} /></button>
        <button className="size-10 rounded-full hover:bg-surface text-muted" aria-label="Video"><Video size={16} /></button>
        <button className="size-10 rounded-full hover:bg-surface text-muted" aria-label="Info"><Info size={16} /></button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1.5">
        {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
        {!isLoading && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="grid place-items-center py-20 text-center text-muted"
          >
            <div className="size-16 rounded-2xl bg-grad-accent shadow-glow grid place-items-center mb-4">
              <Users2 size={22} className="text-accent-fg" />
            </div>
            <p className="text-sm">This is the start of your conversation.</p>
          </motion.div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const sameSender = prev && prev.senderId === m.senderId;
          const sender = memberMap.get(String(m.senderId));
          return (
            <MessageBubble
              key={m._id}
              id={String(m._id)}
              content={m.content}
              attachments={m.attachments}
              reactions={m.reactions}
              senderId={String(m.senderId)}
              senderName={sender?.name}
              senderAvatar={sender?.avatar}
              createdAt={m.createdAt}
              mine={String(m.senderId) === me?.id}
              showAvatar={!sameSender}
              showName={!sameSender && room.type !== 'dm' && String(m.senderId) !== me?.id}
              edited={m.edited}
            />
          );
        })}

        {typingNames.length > 0 && (
          <TypingDots name={room.type === 'dm' ? undefined : typingNames[0]} />
        )}
      </div>

      <Composer roomId={room.id} onSend={() => force((n) => n + 1)} />
    </section>
  );
}
