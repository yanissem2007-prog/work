import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pub, sub } from '../config/redis';
import { logger } from '../config/logger';
import { registerChat } from './chat.handler';
import { registerPresence } from './presence.handler';
import { registerNotifications } from './notifications.handler';
import { registerChannels } from './channel.handler';
import { setIO } from './registry';

export function attachSockets(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN.split(','), credentials: true }
  });
  io.adapter(createAdapter(pub, sub));
  setIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('UNAUTHORIZED'));
    try {
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: string };
      socket.data.userId = claims.sub;
      socket.data.role = claims.role;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.userId as string;
    socket.join(`user:${uid}`);
    logger.debug(`socket connected ${uid}`);
    registerChat(io, socket);
    registerPresence(io, socket);
    registerNotifications(io, socket);
    registerChannels(io, socket);
  });

  return io;
}
