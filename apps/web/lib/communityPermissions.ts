import type { CommunityRole } from '@work/types';

export type CommunityPermission =
  | 'community.edit'
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
  owner: ['community.edit','channel.manage','member.invite','member.kick','member.ban','member.mute','member.role','message.send','message.delete-any','message.pin'],
  admin: ['community.edit','channel.manage','member.invite','member.kick','member.ban','member.mute','message.send','message.delete-any','message.pin'],
  moderator: ['member.invite','member.mute','message.send','message.delete-any','message.pin'],
  member: ['message.send']
};

export const can = (role: CommunityRole | undefined, perm: CommunityPermission): boolean =>
  !!role && MATRIX[role].includes(perm);
