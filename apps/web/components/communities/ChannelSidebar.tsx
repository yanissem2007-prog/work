'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Megaphone, BookOpen, Calendar, Plus, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import type { Channel, Community, ChannelType } from '@work/types';
import { Badge } from '@/components/ui/Badge';
import { can } from '@/lib/communityPermissions';
import { cn } from '@/lib/utils';

const ICONS: Record<ChannelType, React.ComponentType<{ size?: number; className?: string }>> = {
  text: Hash, announcement: Megaphone, resource: BookOpen, event: Calendar
};

interface Props {
  community: Community;
  activeChannelId?: string;
  onSelect: (ch: Channel) => void;
  onCreateChannel: () => void;
  onSettings: () => void;
}

export function ChannelSidebar({ community, activeChannelId, onSelect, onCreateChannel, onSettings }: Props) {
  const [open, setOpen] = useState<Record<ChannelType, boolean>>({ announcement: true, text: true, resource: true, event: true });
  const role = community.viewer?.role;
  const groups: ChannelType[] = ['announcement', 'text', 'resource', 'event'];
  const canManage = can(role, 'channel.manage');

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-bg-elev/30 flex flex-col">
      <header className="relative h-16 border-b border-border flex items-center px-4">
        <p className="font-display text-base truncate flex-1">{community.name}</p>
        <button onClick={onSettings} className="text-muted hover:text-fg p-1 rounded">
          <Settings size={14} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {groups.map((type) => {
          const channels = community.channels.filter((c) => c.type === type).sort((a, b) => a.position - b.position);
          if (channels.length === 0 && type !== 'text') return null;
          const Icon = ICONS[type];
          const isOpen = open[type];
          return (
            <div key={type}>
              <button
                onClick={() => setOpen((s) => ({ ...s, [type]: !s[type] }))}
                className="w-full flex items-center justify-between px-2 py-1 text-2xs uppercase tracking-caps text-muted hover:text-fg"
              >
                <span className="flex items-center gap-1">
                  {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  {type}
                </span>
                {canManage && type === 'text' && (
                  <span onClick={(e) => { e.stopPropagation(); onCreateChannel(); }}
                    className="cursor-pointer hover:text-accent"><Plus size={12} /></span>
                )}
              </button>
              {isOpen && channels.map((ch) => {
                const active = ch._id === activeChannelId;
                return (
                  <button
                    key={ch._id}
                    onClick={() => onSelect(ch)}
                    className={cn(
                      'relative w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition',
                      active ? 'text-fg' : 'text-muted hover:text-fg hover:bg-surface'
                    )}
                  >
                    {active && (
                      <motion.span layoutId="ch-active"
                        className="absolute inset-0 rounded-lg bg-surface-2 border border-border" />
                    )}
                    <Icon size={14} className="relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {role && (
        <footer className="p-2 border-t border-border">
          <Badge variant="soft" className="text-2xs">Your role: {role}</Badge>
        </footer>
      )}
    </aside>
  );
}
