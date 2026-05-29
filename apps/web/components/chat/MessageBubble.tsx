'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, FileText, Download, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';

interface Attachment {
  url: string; type: 'image' | 'video' | 'file';
  name?: string; size?: number; mime?: string;
}

interface MessageProps {
  id: string;
  content?: string;
  attachments?: Attachment[];
  reactions?: { emoji: string; userId: string }[];
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  createdAt: string;
  mine: boolean;
  showAvatar: boolean;
  showName: boolean;
  edited?: boolean;
}

const QUICK = ['❤️', '🔥', '👍', '🎉', '😂', '💡'];

export function MessageBubble(m: MessageProps) {
  const [showPicker, setShowPicker] = useState(false);

  async function react(emoji: string) {
    setShowPicker(false);
    await api.post(`/chat/messages/${m.id}/react`, { emoji });
  }

  const grouped = (m.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group flex gap-2 px-3', m.mine ? 'justify-end' : 'justify-start')}
    >
      {!m.mine && (
        <div className="w-8 shrink-0">
          {m.showAvatar && <Avatar src={m.senderAvatar} name={m.senderName} size="sm" />}
        </div>
      )}

      <div className={cn('relative max-w-[75%] sm:max-w-[60%]', m.mine && 'items-end')}>
        {!m.mine && m.showName && (
          <p className="text-2xs text-muted mb-0.5 ml-1">{m.senderName}</p>
        )}

        {m.attachments?.map((a, i) => (
          <div key={i} className={cn('mb-1 rounded-2xl overflow-hidden max-w-xs', m.mine && 'ml-auto')}>
            {a.type === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.name} className="w-full object-cover" loading="lazy" />
            )}
            {a.type === 'video' && <video src={a.url} controls className="w-full" />}
            {a.type === 'file' && (
              <a href={a.url} target="_blank" rel="noopener"
                 className="flex items-center gap-3 glass rounded-2xl p-3 hover:bg-surface-2 transition">
                <div className="size-10 rounded-xl bg-grad-accent grid place-items-center">
                  <FileText size={16} className="text-accent-fg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.name ?? 'File'}</p>
                  {a.size && <p className="text-2xs text-muted">{fmtSize(a.size)}</p>}
                </div>
                <Download size={14} className="text-muted" />
              </a>
            )}
          </div>
        ))}

        {m.content && (
          <div className={cn(
            'relative inline-block px-3.5 py-2 text-sm rounded-2xl break-words whitespace-pre-wrap',
            m.mine
              ? 'bg-grad-accent text-accent-fg rounded-tr-sm shadow-glow'
              : 'bg-surface-2 text-fg rounded-tl-sm'
          )}>
            {m.content}
          </div>
        )}

        <div className={cn('flex items-center gap-1.5 mt-0.5 text-2xs text-muted', m.mine && 'justify-end')}>
          <span>{formatRelative(m.createdAt)}</span>
          {m.edited && <span>· edited</span>}
        </div>

        {Object.keys(grouped).length > 0 && (
          <div className={cn('mt-1 flex flex-wrap gap-1', m.mine && 'justify-end')}>
            {Object.entries(grouped).map(([emoji, n]) => (
              <button key={emoji} onClick={() => react(emoji)}
                className="glass rounded-pill px-2 py-0.5 text-2xs flex items-center gap-1 hover:scale-105 transition">
                <span>{emoji}</span> <span className="tabular-nums">{n}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover actions */}
        <div className={cn(
          'absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          m.mine ? '-left-16' : '-right-16'
        )}>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="size-7 rounded-full glass grid place-items-center hover:scale-110 transition"
            aria-label="React"
          ><Smile size={13} /></button>
          <button className="size-7 rounded-full glass grid place-items-center" aria-label="More">
            <MoreHorizontal size={13} />
          </button>
        </div>

        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              'absolute z-10 -top-10 glass-strong rounded-pill px-1.5 py-1 flex gap-0.5',
              m.mine ? 'right-0' : 'left-0'
            )}
          >
            {QUICK.map((e) => (
              <button key={e} onClick={() => react(e)} className="size-7 grid place-items-center rounded-full hover:bg-surface text-base">
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
