import type { Server, Socket } from 'socket.io';
import { RoomModel } from '../modules/chat/chat.model';

export function registerChat(io: Server, socket: Socket) {
  const uid = socket.data.userId as string;

  // Auto-join all the user's rooms — fan-out on connection.
  RoomModel.find({ members: uid }).select('_id').lean().then((rooms) => {
    rooms.forEach((r) => socket.join(`room:${String(r._id)}`));
  });

  socket.on('chat:join', async (roomId: string) => {
    const room = await RoomModel.findOne({ _id: roomId, members: uid }).select('_id').lean();
    if (!room) return;
    socket.join(`room:${roomId}`);
  });

  socket.on('chat:leave', (roomId: string) => {
    socket.leave(`room:${roomId}`);
  });

  socket.on('chat:typing', ({ roomId, typing }: { roomId: string; typing: boolean }) => {
    socket.to(`room:${roomId}`).emit('chat:typing', { roomId, userId: uid, typing: !!typing });
  });
}
