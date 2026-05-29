'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Pencil, Users2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { formatRelative, cn } from '@/lib/utils';

interface Room {
  id: string; type: 'dm' | 'group' | 'community';
  title: string; avatar?: string;
  members: { id: string }[];
  lastMessage?: { content?: string; at?: string };
  lastMessageAt?: string;
}

interface Props {
  rooms: Room[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewGroup: () => void;
}

export function RoomList({ rooms, activeId, onSelect, onNewGroup }: Props) {
  const me = useAuthStore((s) => s.user);
  const online = useChatStore((s) => s.online);
  const [q, setQ] = useState('');

  const filtered = rooms.filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside className="w-full lg:w-80 shrink-0 border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl tracking-tighter">Messages</h2>
          <button
            onClick={onNewGroup}
            className="size-8 grid place-items-center rounded-full glass hover:bg-surface-2 transition"
            aria-label="New group"
          ><Pencil size={14} /></button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-surface rounded-pill pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted py-10">No conversations yet.</p>
        )}
        {filtered.map((r) => {
          const active = r.id === activeId;
          const otherId = r.members.find((m) => m.id !== me?.id)?.id;
          const isOnline = r.type === 'dm' && otherId && online.has(otherId);
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                'relative w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors duration-fast',
                active ? 'bg-surface-2' : 'hover:bg-surface'
              )}
            >
              {active && (
                <motion.span layoutId="room-active"
                  className="absolute inset-0 rounded-xl border border-border bg-surface-2 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <div className="relative shrink-0">
                {r.type === 'group' ? (
                  <div className="size-10 rounded-full bg-grad-accent grid place-items-center text-accent-fg shadow-glow">
                    <Users2 size={16} />
                  </div>
                ) : (
                  <Avatar src={r.avatar} name={r.title} status={isOnline ? 'online' : undefined} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.lastMessageAt && (
                    <span className="text-2xs text-muted shrink-0">{formatRelative(r.lastMessageAt)}</span>
                  )}
                </div>
                <p className="text-xs text-muted truncate">
                  {r.lastMessage?.content || 'Say hi 👋'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
