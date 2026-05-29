'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings as SettingsIcon, CheckCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { Button } from '@/components/ui/Button';
import { NotificationRow, type NotificationRowData } from '@/components/notifications/NotificationRow';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'messages', label: 'Messages' }
] as const;
type Tab = typeof TABS[number]['id'];

export function NotificationsDropdown() {
  const qc = useQueryClient();
  const socket = useSocket();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('all');

  const counts = useQuery<{ total: number; byCategory: Record<string, number> }>({
    queryKey: ['notif-counts'],
    queryFn: async () => (await api.get('/notifications/counts')).data.data
  });

  const list = useQuery<NotificationRowData[]>({
    enabled: open,
    queryKey: ['notif-dropdown', tab],
    queryFn: async () => (await api.get('/notifications', {
      params: { category: tab === 'all' ? undefined : tab, limit: 12 }
    })).data.data
  });

  useEffect(() => {
    if (!socket) return;
    const onPush = () => {
      qc.invalidateQueries({ queryKey: ['notif-counts'] });
      qc.invalidateQueries({ queryKey: ['notif-dropdown'] });
    };
    socket.on('notif:push', onPush);
    return () => { socket.off('notif:push', onPush); };
  }, [socket, qc]);

  async function markAllRead() {
    await api.patch('/notifications/read', { ids: list.data?.filter((n) => !n.read).map((n) => n._id) });
    qc.invalidateQueries({ queryKey: ['notif-counts'] });
    qc.invalidateQueries({ queryKey: ['notif-dropdown'] });
  }

  const unread = counts.data?.total ?? 0;

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <Button size="icon" variant="ghost" aria-label="Notifications" className="relative">
          <motion.span
            key={unread}
            initial={{ scale: 1 }}
            animate={unread > 0 ? { rotate: [0, -10, 10, -6, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block"
          >
            <Bell size={18} />
          </motion.span>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute top-1 right-1 size-4 text-[10px] grid place-items-center rounded-full bg-accent text-accent-fg font-medium tabular-nums shadow-glow"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content asChild align="end" sideOffset={8}>
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-[400px] max-w-[92vw] glass-strong rounded-2xl shadow-xl border border-border z-[80] overflow-hidden"
          >
            <header className="px-4 py-3 border-b border-border flex items-center gap-2">
              <p className="font-medium text-sm flex-1">Notifications</p>
              <button onClick={markAllRead}
                className="text-2xs text-accent hover:underline inline-flex items-center gap-1">
                <CheckCheck size={11} /> Mark read
              </button>
              <Link href="/settings/notifications" onClick={() => setOpen(false)}
                className="size-7 grid place-items-center rounded-full hover:bg-surface text-muted">
                <SettingsIcon size={13} />
              </Link>
            </header>

            <div className="px-2 pt-2 flex gap-1">
              {TABS.map((t) => {
                const active = tab === t.id;
                const count = t.id === 'all' ? counts.data?.total : counts.data?.byCategory[t.id as string];
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn(
                      'relative rounded-pill px-2.5 py-1 text-xs flex items-center gap-1 transition',
                      active ? 'text-fg' : 'text-muted hover:text-fg'
                    )}>
                    {active && (
                      <motion.span layoutId="notif-tab"
                        className="absolute inset-0 rounded-pill bg-surface-2 border border-border"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                    <span className="relative z-10">{t.label}</span>
                    {count !== undefined && count > 0 && (
                      <span className="relative z-10 text-[10px] px-1 rounded-full bg-accent text-accent-fg tabular-nums">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[420px] overflow-y-auto px-2 py-2">
              {list.isLoading && (
                <p className="text-center text-xs text-muted py-6">Loading…</p>
              )}
              {!list.isLoading && (list.data?.length ?? 0) === 0 && (
                <p className="text-center text-xs text-muted py-10">Nothing here.</p>
              )}
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {list.data?.map((n, i) => (
                    <motion.div key={n._id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}>
                      <NotificationRow notif={n} variant="dropdown"
                        onClick={() => { if (!n.read) api.patch(`/notifications/${n._id}`, { read: true }); setOpen(false); }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <footer className="border-t border-border">
              <Link href="/notifications" onClick={() => setOpen(false)}
                className="block text-center py-2.5 text-xs text-accent hover:bg-surface transition">
                View all notifications →
              </Link>
            </footer>
          </motion.div>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
