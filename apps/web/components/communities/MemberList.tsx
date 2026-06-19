'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Crown, Shield, ShieldCheck, User as UserIcon, MoreHorizontal, UserX, VolumeX, ShieldOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Community, CommunityRole, User } from '@work/types';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { useChatStore } from '@/stores/chatStore';
import { can } from '@/lib/communityPermissions';
import { cn } from '@/lib/utils';

interface MemberRow {
  id: string;
  role: CommunityRole;
  mutedUntil?: string;
  user: Pick<User, 'handle' | 'name' | 'avatar' | 'headline'> & { _id: string; id?: string };
}

const ROLE_ICON: Record<CommunityRole, LucideIcon> = {
  owner: Crown, admin: ShieldCheck, moderator: Shield, member: UserIcon
};
const ROLE_COLOR: Record<CommunityRole, string> = {
  owner: 'text-warning', admin: 'text-accent', moderator: 'text-success', member: 'text-muted'
};

export function MemberList({ community }: { community: Community }) {
  const qc = useQueryClient();
  const online = useChatStore((s) => s.online);
  const myRole = community.viewer?.role;

  const { data: members = [] } = useQuery<MemberRow[]>({
    queryKey: ['community', community.slug, 'members'],
    queryFn: async () => (await api.get(`/communities/${community.slug}/members`)).data.data
  });

  const byRole: Record<CommunityRole, MemberRow[]> = { owner: [], admin: [], moderator: [], member: [] };
  members.forEach((m) => byRole[m.role].push(m));

  async function action(verb: 'kick' | 'ban' | 'mute' | 'promote-mod' | 'promote-admin' | 'demote', m: MemberRow) {
    const userId = (m.user as any)._id ?? m.user.id;
    if (verb === 'kick') await api.delete(`/communities/${community.slug}/members/${userId}`);
    else if (verb === 'ban') await api.post(`/communities/${community.slug}/members/${userId}/ban`, { reason: 'No reason given' });
    else if (verb === 'mute') await api.post(`/communities/${community.slug}/members/${userId}/mute`, { minutes: 60 });
    else if (verb === 'promote-mod') await api.patch(`/communities/${community.slug}/members/${userId}/role`, { role: 'moderator' });
    else if (verb === 'promote-admin') await api.patch(`/communities/${community.slug}/members/${userId}/role`, { role: 'admin' });
    else if (verb === 'demote') await api.patch(`/communities/${community.slug}/members/${userId}/role`, { role: 'member' });
    qc.invalidateQueries({ queryKey: ['community', community.slug, 'members'] });
  }

  return (
    <aside className="hidden xl:flex w-60 shrink-0 border-l border-border bg-bg-elev/30 flex-col">
      <header className="h-16 border-b border-border flex items-center px-4">
        <p className="text-eyebrow">Members · {community.membersCount}</p>
      </header>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {(Object.keys(byRole) as CommunityRole[]).map((role) => {
          const list = byRole[role];
          if (list.length === 0) return null;
          const Icon = ROLE_ICON[role];
          return (
            <div key={role}>
              <p className="px-2 py-1 text-2xs uppercase tracking-caps text-muted flex items-center gap-1">
                <Icon size={11} className={ROLE_COLOR[role]} /> {role}s — {list.length}
              </p>
              {list.map((m) => {
                const uid = (m.user as any)._id ?? m.user.id;
                const isOnline = online.has(uid);
                return (
                  <div key={m.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface">
                    <Avatar src={m.user.avatar} name={m.user.name} size="sm" status={isOnline ? 'online' : undefined} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', !isOnline && 'text-muted')}>{m.user.name}</p>
                    </div>
                    {can(myRole, 'member.kick') && role !== 'owner' && (
                      <Dropdown.Root>
                        <Dropdown.Trigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-fg"
                            aria-label="Manage member">
                            <MoreHorizontal size={14} />
                          </button>
                        </Dropdown.Trigger>
                        <Dropdown.Portal>
                          <Dropdown.Content align="end" sideOffset={4}
                            className="glass-strong rounded-xl p-1 z-50 min-w-[180px] text-sm">
                            {can(myRole, 'member.role') && role === 'member' && (
                              <Item onClick={() => action('promote-mod', m)} icon={<Shield size={13} />}>Make moderator</Item>
                            )}
                            {can(myRole, 'member.role') && role !== 'admin' && (
                              <Item onClick={() => action('promote-admin', m)} icon={<ShieldCheck size={13} />}>Make admin</Item>
                            )}
                            {can(myRole, 'member.role') && role !== 'member' && (
                              <Item onClick={() => action('demote', m)} icon={<ShieldOff size={13} />}>Demote to member</Item>
                            )}
                            {can(myRole, 'member.mute') && <Item onClick={() => action('mute', m)} icon={<VolumeX size={13} />}>Mute 1h</Item>}
                            {can(myRole, 'member.kick') && <Item onClick={() => action('kick', m)} icon={<UserX size={13} />}>Kick</Item>}
                            {can(myRole, 'member.ban') && <Item onClick={() => action('ban', m)} icon={<UserX size={13} />} danger>Ban</Item>}
                          </Dropdown.Content>
                        </Dropdown.Portal>
                      </Dropdown.Root>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function Item({ children, icon, onClick, danger }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <Dropdown.Item onSelect={onClick}
      className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-surface',
        danger && 'text-danger hover:bg-danger/10')}>
      {icon} {children}
    </Dropdown.Item>
  );
}
