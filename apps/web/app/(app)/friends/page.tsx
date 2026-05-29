'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserPlus, UserCheck, X, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { User } from '@work/types';

type Tab = 'friends' | 'requests' | 'suggestions';

interface FriendRequest { _id: string; requesterId: string; createdAt: string }

export default function FriendsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('friends');

  const friends = useQuery<User[]>({
    queryKey: ['friends'], enabled: tab === 'friends',
    queryFn: async () => (await api.get('/users/friends')).data.data
  });

  const requests = useQuery<{ requests: FriendRequest[]; users: User[] }>({
    queryKey: ['friend-requests'], enabled: tab === 'requests',
    queryFn: async () => (await api.get('/users/friends/requests')).data.data
  });

  const suggestions = useQuery<User[]>({
    queryKey: ['suggestions-page'], enabled: tab === 'suggestions',
    queryFn: async () => (await api.get('/users/suggestions')).data.data
  });

  const accept = useMutation({
    mutationFn: (id: string) => api.post(`/users/friends/${id}/accept`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['friend-requests'] }); qc.invalidateQueries({ queryKey: ['friends'] }); }
  });
  const decline = useMutation({
    mutationFn: (id: string) => api.delete(`/users/friends/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friend-requests'] })
  });
  const follow = useMutation({
    mutationFn: (id: string) => api.post(`/users/follow/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suggestions-page'] })
  });
  const sendRequest = useMutation({
    mutationFn: (id: string) => api.post(`/users/friends/${id}/request`)
  });

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'friends', label: 'Friends', count: friends.data?.length },
    { id: 'requests', label: 'Requests', count: requests.data?.requests.length },
    { id: 'suggestions', label: 'Discover' }
  ];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tighter">Network</h1>
        <Badge variant="soft">{friends.data?.length ?? '—'} friends</Badge>
      </header>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative px-4 py-2.5 text-sm transition flex items-center gap-2',
                active ? 'text-fg' : 'text-muted hover:text-fg'
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-surface-2">{t.count}</span>
              )}
              {active && (
                <motion.span layoutId="friends-tab"
                  className="absolute inset-x-2 -bottom-px h-0.5 bg-fg" />
              )}
            </button>
          );
        })}
      </div>

      {tab === 'friends' && (
        <>
          {friends.data?.length === 0 && (
            <Empty icon={Users} text="No friends yet. Try Discover." />
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {friends.data?.map((u) => (
              <Card key={u.id} variant="glass" className="flex items-center gap-3">
                <Avatar src={u.avatar} name={u.name} ring />
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.handle}`} className="font-medium text-sm hover:underline">{u.name}</Link>
                  <p className="text-2xs text-muted truncate">{u.headline ?? `@${u.handle}`}</p>
                </div>
                <Button size="sm" variant="glass">Message</Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'requests' && (
        <>
          {requests.data?.requests.length === 0 && <Empty icon={UserPlus} text="No pending requests." />}
          <div className="space-y-2">
            {requests.data?.requests.map((r) => {
              const u = requests.data?.users.find((x) => x.id === r.requesterId);
              if (!u) return null;
              return (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                >
                  <Avatar src={u.avatar} name={u.name} ring />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${u.handle}`} className="font-medium text-sm hover:underline">{u.name}</Link>
                    <p className="text-2xs text-muted truncate">{u.headline ?? `@${u.handle}`}</p>
                  </div>
                  <Button size="sm" variant="accent" onClick={() => accept.mutate(r._id)}>
                    <UserCheck size={14} /> Accept
                  </Button>
                  <Button size="icon" variant="glass" onClick={() => decline.mutate(r._id)} aria-label="Decline">
                    <X size={14} />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'suggestions' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.data?.map((u) => (
            <Card key={u.id} variant="glass" interactive tilt glow>
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={u.avatar} name={u.name} ring />
                <div className="min-w-0">
                  <Link href={`/profile/${u.handle}`} className="font-medium text-sm hover:underline truncate block">{u.name}</Link>
                  <p className="text-2xs text-muted truncate">{u.headline ?? `@${u.handle}`}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="accent" className="flex-1" onClick={() => follow.mutate(u.id)}>
                  <UserPlus size={14} /> Follow
                </Button>
                <Button size="sm" variant="glass" onClick={() => sendRequest.mutate(u.id)}>Add friend</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number }>; text: string }) {
  return (
    <div className="glass rounded-2xl py-16 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-surface-2 grid place-items-center"><Icon size={20} /></div>
      <p className="mt-4 text-sm text-muted">{text}</p>
    </div>
  );
}
