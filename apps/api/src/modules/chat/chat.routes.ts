import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { RoomModel, MessageModel } from './chat.model';
import { UserModel } from '../auth/auth.model';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { getIO } from '../../sockets/registry';

const { Types: { ObjectId } } = mongoose;
export const chatRouter = Router();

const memberSelect = 'handle name avatar headline';

async function hydrateRoom(room: any, viewerId: string) {
  const members = await UserModel.find({ _id: { $in: room.members } }).select(memberSelect).lean();
  const byId = new Map(members.map((m) => [String(m._id), m]));

  let title = room.name;
  let avatar = room.avatar;
  if (room.type === 'dm') {
    const other = members.find((m) => String(m._id) !== viewerId);
    title = other?.name ?? 'Direct message';
    avatar = other?.avatar;
  }
  return {
    id: String(room._id),
    type: room.type,
    title,
    avatar,
    members: members.map((m) => ({ id: String(m._id), ...m })),
    isAdmin: room.admins?.map(String).includes(viewerId) ?? false,
    lastMessage: room.lastMessage,
    lastMessageAt: room.lastMessageAt,
    createdAt: room.createdAt
  };
}

/* ─── Rooms ─── */
chatRouter.get('/rooms', authRequired, asyncHandler(async (req, res) => {
  const rooms = await RoomModel.find({ members: req.user!.sub }).sort({ lastMessageAt: -1 }).limit(80).lean();
  const hydrated = await Promise.all(rooms.map((r) => hydrateRoom(r, req.user!.sub)));
  return ok(res, hydrated);
}));

chatRouter.post('/rooms/dm/:userId', authRequired, asyncHandler(async (req, res) => {
  if (req.params.userId === req.user!.sub) throw new HttpError(400, 'SELF', 'Cannot DM yourself');
  const members = [new ObjectId(req.user!.sub), new ObjectId(req.params.userId)].sort();
  let room = await RoomModel.findOne({ type: 'dm', members: { $all: members, $size: 2 } });
  if (!room) {
    room = await RoomModel.create({
      type: 'dm',
      members,
      createdBy: req.user!.sub,
      lastMessageAt: new Date()
    });
  }
  return ok(res, await hydrateRoom(room.toObject(), req.user!.sub));
}));

const GroupDto = z.object({
  name: z.string().min(2).max(60),
  memberIds: z.array(z.string()).min(1).max(40),
  avatar: z.string().url().optional()
});

chatRouter.post('/rooms/group', authRequired, asyncHandler(async (req, res) => {
  const { name, memberIds, avatar } = GroupDto.parse(req.body);
  const members = [req.user!.sub, ...memberIds].map((id) => new ObjectId(id));
  const room = await RoomModel.create({
    type: 'group', name, avatar,
    members,
    admins: [req.user!.sub],
    createdBy: req.user!.sub,
    lastMessageAt: new Date()
  });
  // Notify each invited user
  memberIds.forEach((id) =>
    getIO()?.to(`user:${id}`).emit('chat:invited', { roomId: String(room._id) }));
  return created(res, await hydrateRoom(room.toObject(), req.user!.sub));
}));

chatRouter.patch('/rooms/:id', authRequired, asyncHandler(async (req, res) => {
  const room = await RoomModel.findOne({ _id: req.params.id, admins: req.user!.sub });
  if (!room) throw new HttpError(403, 'FORBIDDEN', 'Admin only');
  if (req.body.name) room.name = req.body.name;
  if (req.body.avatar) room.avatar = req.body.avatar;
  await room.save();
  return ok(res, await hydrateRoom(room.toObject(), req.user!.sub));
}));

chatRouter.post('/rooms/:id/members', authRequired, asyncHandler(async (req, res) => {
  const room = await RoomModel.findOne({ _id: req.params.id, admins: req.user!.sub });
  if (!room) throw new HttpError(403, 'FORBIDDEN', 'Admin only');
  const ids: string[] = req.body.memberIds ?? [];
  await RoomModel.updateOne({ _id: req.params.id }, { $addToSet: { members: { $each: ids.map((i) => new ObjectId(i)) } } });
  ids.forEach((id) => getIO()?.to(`user:${id}`).emit('chat:invited', { roomId: req.params.id }));
  return ok(res, { ok: true });
}));

chatRouter.delete('/rooms/:id/members/:userId', authRequired, asyncHandler(async (req, res) => {
  const room = await RoomModel.findById(req.params.id);
  if (!room) throw new HttpError(404, 'NOT_FOUND', 'Room');
  const isAdmin = room.admins?.map(String).includes(req.user!.sub);
  if (!isAdmin && req.params.userId !== req.user!.sub) throw new HttpError(403, 'FORBIDDEN', 'Not allowed');
  await RoomModel.updateOne({ _id: req.params.id }, { $pull: { members: new ObjectId(req.params.userId), admins: new ObjectId(req.params.userId) } });
  return ok(res, { ok: true });
}));

chatRouter.post('/rooms/:id/leave', authRequired, asyncHandler(async (req, res) => {
  await RoomModel.updateOne(
    { _id: req.params.id, members: req.user!.sub },
    { $pull: { members: new ObjectId(req.user!.sub), admins: new ObjectId(req.user!.sub) } }
  );
  return ok(res, { ok: true });
}));

/* ─── Messages ─── */
chatRouter.get('/rooms/:id/messages', authRequired, asyncHandler(async (req, res) => {
  const room = await RoomModel.findOne({ _id: req.params.id, members: req.user!.sub }).lean();
  if (!room) throw new HttpError(404, 'NOT_FOUND', 'Room');

  const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;
  const filter: Record<string, unknown> = { roomId: req.params.id, deletedAt: null };
  if (cursor) filter.createdAt = { $lt: cursor };

  const limit = Math.min(80, Number(req.query.limit ?? 40));
  const msgs = await MessageModel.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = msgs.length > limit;
  const items = (hasMore ? msgs.slice(0, limit) : msgs).reverse();
  return ok(res, items, { cursor: hasMore ? items[0].createdAt?.toISOString() : undefined });
}));

const SendDto = z.object({
  content: z.string().max(4000).optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video', 'file']),
    name: z.string().optional(),
    size: z.number().optional(),
    mime: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  })).max(6).optional(),
  replyTo: z.string().optional()
}).refine((v) => (v.content && v.content.trim()) || (v.attachments && v.attachments.length), {
  message: 'Empty message'
});

chatRouter.post('/rooms/:id/messages', authRequired, asyncHandler(async (req, res) => {
  const room = await RoomModel.findOne({ _id: req.params.id, members: req.user!.sub });
  if (!room) throw new HttpError(404, 'NOT_FOUND', 'Room');

  const data = SendDto.parse(req.body);
  const msg = await MessageModel.create({
    roomId: req.params.id,
    senderId: req.user!.sub,
    content: data.content ?? '',
    attachments: data.attachments,
    replyTo: data.replyTo,
    readBy: [req.user!.sub]
  });

  room.lastMessage = { content: msg.content || '📎 Attachment', senderId: req.user!.sub as any, at: new Date() };
  room.lastMessageAt = new Date();
  await room.save();

  const payload = msg.toObject();
  getIO()?.to(`room:${req.params.id}`).emit('chat:new', payload);
  return created(res, payload);
}));

chatRouter.patch('/messages/:id', authRequired, asyncHandler(async (req, res) => {
  const msg = await MessageModel.findOneAndUpdate(
    { _id: req.params.id, senderId: req.user!.sub },
    { $set: { content: String(req.body.content ?? ''), edited: true } },
    { new: true }
  );
  if (!msg) throw new HttpError(404, 'NOT_FOUND', 'Message');
  getIO()?.to(`room:${msg.roomId}`).emit('chat:edited', { id: String(msg._id), content: msg.content });
  return ok(res, msg);
}));

chatRouter.delete('/messages/:id', authRequired, asyncHandler(async (req, res) => {
  const msg = await MessageModel.findOneAndUpdate(
    { _id: req.params.id, senderId: req.user!.sub },
    { $set: { deletedAt: new Date(), content: '' } },
    { new: true }
  );
  if (!msg) throw new HttpError(404, 'NOT_FOUND', 'Message');
  getIO()?.to(`room:${msg.roomId}`).emit('chat:deleted', { id: String(msg._id) });
  return ok(res, { ok: true });
}));

const ReactDto = z.object({ emoji: z.string().min(1).max(8) });

chatRouter.post('/messages/:id/react', authRequired, asyncHandler(async (req, res) => {
  const { emoji } = ReactDto.parse(req.body);
  const msg = await MessageModel.findById(req.params.id);
  if (!msg) throw new HttpError(404, 'NOT_FOUND', 'Message');

  const existing = msg.reactions.find((r: any) =>
    String(r.userId) === req.user!.sub && r.emoji === emoji
  );
  if (existing) {
    msg.reactions = msg.reactions.filter((r: any) =>
      !(String(r.userId) === req.user!.sub && r.emoji === emoji)
    ) as any;
  } else {
    msg.reactions.push({ emoji, userId: req.user!.sub as any });
  }
  await msg.save();
  getIO()?.to(`room:${msg.roomId}`).emit('chat:reaction', { id: String(msg._id), reactions: msg.reactions });
  return ok(res, msg.reactions);
}));

chatRouter.post('/rooms/:id/read', authRequired, asyncHandler(async (req, res) => {
  await MessageModel.updateMany(
    { roomId: req.params.id, readBy: { $ne: req.user!.sub } },
    { $addToSet: { readBy: req.user!.sub } }
  );
  getIO()?.to(`room:${req.params.id}`).emit('chat:read', { roomId: req.params.id, userId: req.user!.sub });
  return ok(res, { ok: true });
}));
