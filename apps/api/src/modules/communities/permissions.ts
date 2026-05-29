import type { CommunityRole } from './communities.model';

export type CommunityPermission =
  | 'community.edit'
  | 'community.delete'
  | 'channel.manage'
  | 'member.invite'
  | 'member.kick'
  | 'member.ban'
  | 'member.mute'
  | 'member.role'
  | 'message.send'
  | 'message.delete-any'
  | 'message.pin';

const MATRIX: Record<CommunityRole, readonly CommunityPermission[]> = {
  owner: [
    'community.edit', 'community.delete',
    'channel.manage', 'member.invite', 'member.kick', 'member.ban',
    'member.mute', 'member.role', 'message.send', 'message.delete-any', 'message.pin'
  ],
  admin: [
    'community.edit',
    'channel.manage', 'member.invite', 'member.kick', 'member.ban',
    'member.mute', 'message.send', 'message.delete-any', 'message.pin'
  ],
  moderator: [
    'member.invite', 'member.mute', 'message.send', 'message.delete-any', 'message.pin'
  ],
  member: ['message.send']
};

export const can = (role: CommunityRole | undefined, perm: CommunityPermission): boolean =>
  !!role && MATRIX[role].includes(perm);

const RANK: Record<CommunityRole, number> = { owner: 4, admin: 3, moderator: 2, member: 1 };
export const outranks = (a: CommunityRole | undefined, b: CommunityRole | undefined): boolean =>
  !!a && !!b && RANK[a] > RANK[b];
