'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Archive, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { NotificationRow, type NotificationRowData } from '@/components/notifications/NotificationRow';
import { cn } from '@/lib/utils';

type Category = 'all' | 'social' | 'messages' | 'jobs' | 'events' | 'communities' | 'system';

const TABS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'messages', label: 'Messages' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'events', label: 'Events' },
  { id: 'communities', label: 'Communities' },
  { id: 'system', label: 'System' }
];

export default function NotificationsPage() {
  const qc = useQueryClient();
  const socket = useSocket();
  const [category, setCategory] = useState<Category>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const counts = useQuery<{ total: number; byCategory: Record<string, number> }>({
    queryKey: ['notif-counts'],
    queryFn: async () => (await api.get('/notifications/counts')).data.data
  });

  const list = useQuery<NotificationRowData[]>({
    queryKey: ['notifications', category, unreadOnly],
    queryFn: async () => (await api.get('/notifications', {
      params: { category: category === 'all' ? undefined : category, unread: unreadOnly ? 'true' : undefined }
    })).data.data
  });

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const onPush = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-counts'] });
    };
    socket.on('notif:push', onPush);
    return () => { socket.off('notif:push', onPush); };
  }, [socket, qc]);

  const markRead = useMutation({
    mutationFn: async (id?: string) => api.patch(id ? `/notifications/${id}` : '/notifications/read',
      id ? { read: true } : { ids: list.data?.filter((n) => !n.read).map((n) => n._id) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-counts'] });
    }
  });

  const archiveAll = useMutation({
    mutationFn: async () => api.delete('/notifications'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-counts'] });
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
            <Bell size={11} /> Notifications
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-tightest">
            {counts.data?.total ? `${counts.data.total} unread` : 'All caught up'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" size="sm"
            onClick={() => markRead.mutate(undefined)} loading={markRead.isPending}>
            <CheckCheck size={13} /> Mark all read
          </Button>
          <Button variant="glass" size="sm"
            onClick={() => archiveAll.mutate()} loading={archiveAll.isPending}>
            <Archive size={13} /> Archive all
          </Button>
          <Link href="/settings/notifications">
            <Button variant="ghost" size="sm"><SettingsIcon size={13} /> Settings</Button>
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {TABS.map((t) => {
          const active = category === t.id;
          const count = t.id === 'all' ? counts.data?.total : counts.data?.byCategory[t.id];
          return (
            <button key={t.id} onClick={() => setCategory(t.id)}
              className={cn(
                'relative rounded-pill px-3 py-1.5 text-xs border transition flex items-center gap-1.5 shrink-0',
                active ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
              )}>
              {t.label}
              {count !== undefined && count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <button onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            'ml-auto rounded-pill px-3 py-1.5 text-xs border transition shrink-0',
            unreadOnly ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
          )}>
          Unread only
        </button>
      </div>

      {/* List */}
      {list.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!list.isLoading && (list.data?.length ?? 0) === 0 && (
        <Card variant="glass" className="text-center py-16">
          <Bell size={26} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">You're all caught up.</p>
          <p className="text-xs text-muted mt-1">New activity will land here in real time.</p>
        </Card>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {list.data?.map((n, i) => (
            <motion.div key={n._id}
              layout
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
            >
              <NotificationRow notif={n} onClick={() => !n.read && markRead.mutate(n._id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
