'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { useChatStore } from '@/stores/chatStore';
import { RoomList } from '@/components/chat/RoomList';
import { Conversation } from '@/components/chat/Conversation';
import { NewGroupModal } from '@/components/chat/NewGroupModal';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const qc = useQueryClient();
  const socket = useSocket();
  const setTyping = useChatStore((s) => s.setTyping);
  const setOnline = useChatStore((s) => s.setOnline);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);

  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ['rooms'],
    queryFn: async () => (await api.get('/chat/rooms')).data.data
  });

  // Global chat events: keep room list fresh + presence/typing
  useEffect(() => {
    if (!socket) return;
    const onNew = () => qc.invalidateQueries({ queryKey: ['rooms'] });
    const onInvited = () => qc.invalidateQueries({ queryKey: ['rooms'] });
    const onTyping = ({ roomId, userId, typing }: { roomId: string; userId: string; typing: boolean }) =>
      setTyping(roomId, userId, typing);
    const onPresence = ({ userId, online }: { userId: string; online: boolean }) =>
      setOnline(userId, online);

    socket.on('chat:new', onNew);
    socket.on('chat:invited', onInvited);
    socket.on('chat:typing', onTyping);
    socket.on('presence:update', onPresence);
    return () => {
      socket.off('chat:new', onNew);
      socket.off('chat:invited', onInvited);
      socket.off('chat:typing', onTyping);
      socket.off('presence:update', onPresence);
    };
  }, [socket, qc, setTyping, setOnline]);

  const active = rooms.find((r) => r.id === activeId);

  return (
    <div className="-mx-4 sm:-mx-6 -my-6 h-[calc(100dvh-0px)] lg:h-[calc(100dvh-0px)]">
      <div className="h-full flex bg-bg-elev/40 lg:rounded-2xl overflow-hidden lg:border lg:border-border lg:my-4 lg:mx-4">
        <div className={cn(
          'flex w-full lg:w-auto h-full',
          activeId ? 'hidden lg:flex' : 'flex'
        )}>
          <RoomList
            rooms={rooms}
            activeId={activeId ?? undefined}
            onSelect={setActiveId}
            onNewGroup={() => setGroupOpen(true)}
          />
        </div>

        <div className={cn(
          'flex-1 h-full',
          activeId ? 'flex' : 'hidden lg:flex'
        )}>
          {active ? (
            <Conversation room={active} onBack={() => setActiveId(null)} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 grid place-items-center text-center px-6"
            >
              <div>
                <div className="mx-auto size-20 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow">
                  <MessageSquare size={28} className="text-accent-fg" />
                </div>
                <h2 className="mt-6 font-display text-2xl tracking-tighter">Your messages</h2>
                <p className="mt-1 text-muted text-sm max-w-xs">
                  Pick a conversation, or start a new group.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <NewGroupModal
        open={groupOpen}
        onOpenChange={setGroupOpen}
        onCreated={(id) => { setActiveId(id); qc.invalidateQueries({ queryKey: ['rooms'] }); }}
      />
    </div>
  );
}
