import type { Server, Socket } from 'socket.io';
import { MembershipModel } from '../modules/communities/communities.model';

export function registerChannels(_io: Server, socket: Socket) {
  const uid = socket.data.userId as string;

  // Auto-join all communities the viewer belongs to
  MembershipModel.find({ userId: uid, bannedAt: null }).select('communityId').lean()
    .then((rows) => rows.forEach((r) => socket.join(`community:${String(r.communityId)}`)));

  socket.on('channel:join', async ({ channelId, communityId }: { channelId: string; communityId: string }) => {
    const ok = await MembershipModel.exists({ communityId, userId: uid, bannedAt: null });
    if (!ok) return;
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('channel:typing', ({ channelId, typing }: { channelId: string; typing: boolean }) => {
    socket.to(`channel:${channelId}`).emit('channel:typing', { channelId, userId: uid, typing: !!typing });
  });
}
