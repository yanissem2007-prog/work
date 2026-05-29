import type { Server, Socket } from 'socket.io';
import { NotificationModel } from '../modules/notifications/notifications.model';

export function registerNotifications(_io: Server, socket: Socket) {
  const uid = socket.data.userId as string;

  socket.on('notif:fetch', async (ack) => {
    const list = await NotificationModel.find({ userId: uid, read: false })
      .sort({ createdAt: -1 }).limit(30).lean();
    ack?.(list);
  });
}

export async function pushNotification(io: Server, userId: string, payload: unknown) {
  io.to(`user:${userId}`).emit('notif:push', payload);
}
