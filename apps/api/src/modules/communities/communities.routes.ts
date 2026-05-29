import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CommunityModel, MembershipModel, ChannelMessageModel, CHANNEL_TYPES, COMMUNITY_ROLES } from './communities.model';
import { UserModel } from '../auth/auth.model';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { can, outranks } from './permissions';
import { getIO } from '../../sockets/registry';
import { awardXp } from '../gamification/xp.service';

const { Types: { ObjectId } } = mongoose;
export const communityRouter = Router();

async function viewerMembership(communityId: string, userId: string) {
  return MembershipModel.findOne({ communityId, userId, bannedAt: null }).lean();
}

async function requireMember(communityId: string, userId: string) {
  const m = await viewerMembership(communityId, userId);
  if (!m) throw new HttpError(403, 'NOT_MEMBER', 'Join the community first');
  return m;
}

/* ─── Discover / list ─── */
communityRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const filter: Record<string, unknown> = { visibility: 'public' };
  if (q) filter.$text = { $search: q };
  const list = await CommunityModel.find(filter).sort({ membersCount: -1, createdAt: -1 }).limit(40).lean();
  return ok(res, list);
}));

communityRouter.get('/mine', authRequired, asyncHandler(async (req, res) => {
  const memberships = await MembershipModel.find({ userId: req.user!.sub, bannedAt: null }).lean();
  const ids = memberships.map((m) => m.communityId);
  const list = await CommunityModel.find({ _id: { $in: ids } }).lean();
  const byId = new Map(list.map((c) => [String(c._id), c]));
  return ok(res, memberships.map((m) => ({
    ...byId.get(String(m.communityId)),
    role: m.role,
    joinedAt: m.joinedAt
  })).filter(Boolean));
}));

/* ─── Create ─── */
const CreateDto = z.object({
  slug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(60),
  description: z.string().max(600).optional(),
  icon: z.string().url().optional(),
  banner: z.string().url().optional(),
  accent: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.enum(['public', 'private']).optional()
});

communityRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = CreateDto.parse(req.body);
  const exists = await CommunityModel.exists({ slug: data.slug });
  if (exists) throw new HttpError(409, 'CONFLICT', 'Slug taken');

  const c = await CommunityModel.create({
    ...data,
    ownerId: req.user!.sub,
    membersCount: 1,
    channels: [
      { name: 'welcome', slug: 'welcome', type: 'announcement', position: 0, readOnlyFor: ['member'] },
      { name: 'general', slug: 'general', type: 'text', position: 1 },
      { name: 'resources', slug: 'resources', type: 'resource', position: 2 }
    ]
  });
  await MembershipModel.create({ communityId: c._id, userId: req.user!.sub, role: 'owner' });
  void awardXp(req.user!.sub, 'community.create');
  return created(res, c);
}));

/* ─── Detail ─── */
communityRouter.get('/:slug', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug }).lean();
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const m = await MembershipModel.findOne({ communityId: c._id, userId: req.user!.sub }).lean();
  return ok(res, { ...c, viewer: { role: m?.role, banned: !!m?.bannedAt, mutedUntil: m?.mutedUntil } });
}));

const PatchDto = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(600).optional(),
  icon: z.string().url().optional(),
  banner: z.string().url().optional(),
  accent: z.string().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  rules: z.array(z.object({ title: z.string(), body: z.string() })).optional()
});

communityRouter.patch('/:slug', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const m = await requireMember(String(c._id), req.user!.sub);
  if (!can(m.role, 'community.edit')) throw new HttpError(403, 'FORBIDDEN', 'Cannot edit');
  Object.assign(c, PatchDto.parse(req.body));
  await c.save();
  return ok(res, c);
}));

/* ─── Join / leave ─── */
communityRouter.post('/:slug/join', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  if (c.visibility === 'private') throw new HttpError(403, 'PRIVATE', 'Invite-only community');

  const existing = await MembershipModel.findOne({ communityId: c._id, userId: req.user!.sub });
  if (existing) {
    if (existing.bannedAt) throw new HttpError(403, 'BANNED', 'You are banned');
    return ok(res, existing);
  }
  const m = await MembershipModel.create({ communityId: c._id, userId: req.user!.sub });
  await CommunityModel.updateOne({ _id: c._id }, { $inc: { membersCount: 1 } });
  void awardXp(req.user!.sub, 'community.join');
  getIO()?.to(`community:${c._id}`).emit('community:member-joined', { userId: req.user!.sub });
  return created(res, m);
}));

communityRouter.post('/:slug/leave', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  if (String(c.ownerId) === req.user!.sub) throw new HttpError(400, 'OWNER', 'Transfer ownership before leaving');
  const r = await MembershipModel.deleteOne({ communityId: c._id, userId: req.user!.sub, bannedAt: null });
  if (r.deletedCount) await CommunityModel.updateOne({ _id: c._id }, { $inc: { membersCount: -1 } });
  return ok(res, { ok: true });
}));

/* ─── Members ─── */
communityRouter.get('/:slug/members', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug }).lean();
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const ms = await MembershipModel.find({ communityId: c._id, bannedAt: null }).lean();
  const users = await UserModel.find({ _id: { $in: ms.map((m) => m.userId) } })
    .select('handle name avatar headline').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return ok(res, ms.map((m) => ({
    id: String(m._id),
    role: m.role,
    mutedUntil: m.mutedUntil,
    joinedAt: m.joinedAt,
    user: byId.get(String(m.userId))
  })));
}));

const RoleDto = z.object({ role: z.enum(COMMUNITY_ROLES) });
communityRouter.patch('/:slug/members/:userId/role', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'member.role')) throw new HttpError(403, 'FORBIDDEN', 'Owner only');
  const { role } = RoleDto.parse(req.body);
  if (role === 'owner') throw new HttpError(400, 'INVALID', 'Use transfer for owner');
  const target = await MembershipModel.findOne({ communityId: c._id, userId: req.params.userId });
  if (!target) throw new HttpError(404, 'NOT_FOUND', 'Member');
  target.role = role; await target.save();
  return ok(res, target);
}));

communityRouter.delete('/:slug/members/:userId', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'member.kick')) throw new HttpError(403, 'FORBIDDEN', 'Cannot kick');
  const target = await MembershipModel.findOne({ communityId: c._id, userId: req.params.userId }).lean();
  if (!target) throw new HttpError(404, 'NOT_FOUND', 'Member');
  if (!outranks(me.role, target.role)) throw new HttpError(403, 'FORBIDDEN', 'Cannot kick equal/higher rank');
  await MembershipModel.deleteOne({ _id: target._id });
  await CommunityModel.updateOne({ _id: c._id }, { $inc: { membersCount: -1 } });
  return ok(res, { ok: true });
}));

const BanDto = z.object({ reason: z.string().max(300).optional() });
communityRouter.post('/:slug/members/:userId/ban', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'member.ban')) throw new HttpError(403, 'FORBIDDEN', 'Cannot ban');
  const { reason } = BanDto.parse(req.body);
  const target = await MembershipModel.findOneAndUpdate(
    { communityId: c._id, userId: req.params.userId },
    { $set: { bannedAt: new Date(), bannedReason: reason } },
    { new: true, upsert: true }
  );
  return ok(res, target);
}));

const MuteDto = z.object({ minutes: z.number().int().min(1).max(60 * 24 * 30) });
communityRouter.post('/:slug/members/:userId/mute', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'member.mute')) throw new HttpError(403, 'FORBIDDEN', 'Cannot mute');
  const { minutes } = MuteDto.parse(req.body);
  const target = await MembershipModel.findOneAndUpdate(
    { communityId: c._id, userId: req.params.userId },
    { $set: { mutedUntil: new Date(Date.now() + minutes * 60_000) } },
    { new: true }
  );
  return ok(res, target);
}));

/* ─── Channels ─── */
const ChannelDto = z.object({
  name: z.string().min(1).max(40),
  type: z.enum(CHANNEL_TYPES).default('text'),
  topic: z.string().max(200).optional()
});

communityRouter.post('/:slug/channels', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'channel.manage')) throw new HttpError(403, 'FORBIDDEN', 'Cannot manage channels');
  const { name, type, topic } = ChannelDto.parse(req.body);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  c.channels.push({
    name, slug, type, topic,
    position: c.channels.length,
    readOnlyFor: type === 'announcement' ? ['member', 'moderator'] : []
  } as any);
  await c.save();
  const ch = c.channels[c.channels.length - 1];
  getIO()?.to(`community:${c._id}`).emit('community:channel-new', ch);
  return created(res, ch);
}));

communityRouter.patch('/:slug/channels/:channelId', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'channel.manage')) throw new HttpError(403, 'FORBIDDEN', 'Cannot manage channels');
  const ch = c.channels.id(req.params.channelId);
  if (!ch) throw new HttpError(404, 'NOT_FOUND', 'Channel');
  if (req.body.name) { ch.name = req.body.name; ch.slug = String(req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  if (req.body.topic !== undefined) ch.topic = req.body.topic;
  if (req.body.position !== undefined) ch.position = req.body.position;
  await c.save();
  return ok(res, ch);
}));

communityRouter.delete('/:slug/channels/:channelId', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (!can(me.role, 'channel.manage')) throw new HttpError(403, 'FORBIDDEN', 'Cannot manage channels');
  c.channels = c.channels.filter((ch: any) => String(ch._id) !== req.params.channelId) as any;
  await c.save();
  await ChannelMessageModel.updateMany({ channelId: req.params.channelId }, { $set: { deletedAt: new Date() } });
  getIO()?.to(`community:${c._id}`).emit('community:channel-deleted', { id: req.params.channelId });
  return ok(res, { ok: true });
}));

/* ─── Channel messages ─── */
communityRouter.get('/:slug/channels/:channelId/messages', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug }).lean();
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  await requireMember(String(c._id), req.user!.sub);
  const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;
  const filter: Record<string, unknown> = { channelId: req.params.channelId, deletedAt: null };
  if (cursor) filter.createdAt = { $lt: cursor };
  const limit = Math.min(80, Number(req.query.limit ?? 40));
  const msgs = await ChannelMessageModel.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = msgs.length > limit;
  const items = (hasMore ? msgs.slice(0, limit) : msgs).reverse();

  // hydrate authors
  const ids = [...new Set(items.map((m) => String(m.authorId)))];
  const authors = await UserModel.find({ _id: { $in: ids } }).select('handle name avatar headline').lean();
  const byId = new Map(authors.map((a) => [String(a._id), a]));
  return ok(res,
    items.map((m) => ({ ...m, author: byId.get(String(m.authorId)) })),
    { cursor: hasMore ? items[0].createdAt?.toISOString() : undefined }
  );
}));

const MsgDto = z.object({
  content: z.string().max(4000).optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video', 'file']),
    name: z.string().optional(),
    size: z.number().optional(),
    mime: z.string().optional()
  })).max(6).optional(),
  replyTo: z.string().optional()
}).refine((v) => (v.content && v.content.trim()) || v.attachments?.length, { message: 'Empty' });

communityRouter.post('/:slug/channels/:channelId/messages', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  if (me.mutedUntil && me.mutedUntil > new Date()) throw new HttpError(403, 'MUTED', 'You are muted');

  const ch = c.channels.id(req.params.channelId);
  if (!ch) throw new HttpError(404, 'NOT_FOUND', 'Channel');
  if (ch.readOnlyFor?.includes(me.role)) throw new HttpError(403, 'READ_ONLY', 'Channel is read-only for your role');

  const data = MsgDto.parse(req.body);
  const msg = await ChannelMessageModel.create({
    communityId: c._id,
    channelId: ch._id,
    authorId: req.user!.sub,
    content: data.content ?? '',
    attachments: data.attachments,
    replyTo: data.replyTo
  });
  const author = await UserModel.findById(req.user!.sub).select('handle name avatar headline').lean();
  const payload = { ...msg.toObject(), author };
  getIO()?.to(`channel:${ch._id}`).emit('channel:new', payload);
  void awardXp(req.user!.sub, 'channel.message');
  return created(res, payload);
}));

communityRouter.delete('/:slug/channels/:channelId/messages/:msgId', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  const me = await requireMember(String(c._id), req.user!.sub);
  const msg = await ChannelMessageModel.findById(req.params.msgId);
  if (!msg) throw new HttpError(404, 'NOT_FOUND', 'Message');
  const isMine = String(msg.authorId) === req.user!.sub;
  if (!isMine && !can(me.role, 'message.delete-any')) {
    throw new HttpError(403, 'FORBIDDEN', 'Cannot delete');
  }
  msg.deletedAt = new Date(); msg.content = ''; await msg.save();
  getIO()?.to(`channel:${msg.channelId}`).emit('channel:deleted', { id: String(msg._id) });
  return ok(res, { ok: true });
}));

communityRouter.post('/:slug/channels/:channelId/messages/:msgId/react', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  await requireMember(String(c._id), req.user!.sub);
  const emoji = z.string().min(1).max(8).parse(req.body?.emoji);
  const msg = await ChannelMessageModel.findById(req.params.msgId);
  if (!msg) throw new HttpError(404, 'NOT_FOUND', 'Message');
  const existing = msg.reactions.find((r: any) => String(r.userId) === req.user!.sub && r.emoji === emoji);
  if (existing) {
    msg.reactions = msg.reactions.filter((r: any) => !(String(r.userId) === req.user!.sub && r.emoji === emoji)) as any;
  } else {
    msg.reactions.push({ emoji, userId: req.user!.sub as any });
  }
  await msg.save();
  getIO()?.to(`channel:${msg.channelId}`).emit('channel:reaction', { id: String(msg._id), reactions: msg.reactions });
  return ok(res, msg.reactions);
}));

/* ─── Search (channels + posts within community) ─── */
communityRouter.get('/:slug/search', authRequired, asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug }).lean();
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
  await requireMember(String(c._id), req.user!.sub);
  const q = String(req.query.q ?? '').trim();
  if (!q) return ok(res, []);
  const msgs = await ChannelMessageModel.find({
    communityId: c._id,
    deletedAt: null,
    content: { $regex: q, $options: 'i' }
  }).sort({ createdAt: -1 }).limit(40).lean();
  return ok(res, msgs);
}));
