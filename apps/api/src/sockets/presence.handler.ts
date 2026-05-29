import type { Server, Socket } from 'socket.io';
import { redis } from '../config/redis';

const KEY = 'presence:online';

export function registerPresence(io: Server, socket: Socket) {
  const uid = socket.data.userId as string;
  redis.sadd(KEY, uid).then(() => io.emit('presence:update', { userId: uid, online: true }));

  socket.on('disconnect', async () => {
    await redis.srem(KEY, uid);
    io.emit('presence:update', { userId: uid, online: false });
  });
}
