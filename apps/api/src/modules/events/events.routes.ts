import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import {
  EventModel, RsvpModel, EventAnnouncementModel,
  EVENT_TYPES, HOST_TYPES, RSVP_STATUSES
} from './events.model';
import { CommunityModel, MembershipModel } from '../communities/communities.model';
import { UserModel } from '../auth/auth.model';
import { NotificationModel } from '../notifications/notifications.model';
import { getIO } from '../../sockets/registry';

const { Types: { ObjectId } } = mongoose;
export const eventRouter = Router();

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function canManage(eventId: string, userId: string): Promise<boolean> {
  const ev = await EventModel.findById(eventId).select('createdBy hostType hostId').lean();
  if (!ev) return false;
  if (String(ev.createdBy) === userId) return true;
  if (ev.hostType === 'community') {
    const m = await MembershipModel.findOne({ communityId: ev.hostId, userId, bannedAt: null }).lean();
    if (m && ['owner', 'admin'].includes(m.role)) return true;
  }
  return false;
}

/* ─── List ─── */

eventRouter.get('/', asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { status: 'published' };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  if (req.query.type) filter.type = { $in: String(req.query.type).split(',') };
  if (req.query.host === 'community') filter.hostType = 'community';
  if (req.query.host === 'university') filter.hostType = 'university';

  const scope = req.query.scope as string | undefined;
  const now = new Date();
  if (scope === 'upcoming') filter.startsAt = { $gte: now };
  else if (scope === 'live') {
    (filter as any).startsAt = { $lte: now };
    (filter as any).endsAt = { $gte: now };
  } else if (scope === 'past') filter.endsAt = { $lt: now };
  else filter.endsAt = { $gte: now };

  const limit = Math.min(40, Number(req.query.limit ?? 20));
  const events = await EventModel.find(filter).sort({ startsAt: 1 }).limit(limit).lean();
  return ok(res, await hydrate(events));
}));

eventRouter.get('/mine', authRequired, asyncHandler(async (req, res) => {
  const rsvps = await RsvpModel.find({ userId: req.user!.sub, status: { $in: ['going', 'maybe', 'waitlist'] } }).lean();
  const events = await EventModel.find({ _id: { $in: rsvps.map((r) => r.eventId) } })
    .sort({ startsAt: 1 }).lean();
  return ok(res, await hydrate(events));
}));

eventRouter.get('/community/:slug', asyncHandler(async (req, res) => {
  const c = await CommunityModel.findOne({ slug: req.params.slug }).select('_id').lean();
  if (!c) return ok(res, []);
  const events = await EventModel.find({ hostType: 'community', hostId: c._id, status: 'published' })
    .sort({ startsAt: 1 }).lean();
  return ok(res, await hydrate(events));
}));

/* ─── Detail ─── */

eventRouter.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const filter = ObjectId.isValid(req.params.idOrSlug)
    ? { _id: new ObjectId(req.params.idOrSlug) }
    : { slug: req.params.idOrSlug };
  const event = await EventModel.findOne(filter).lean();
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event');
  const [host] = await hydrate([event]);
  const rsvp = (req as any).user
    ? await RsvpModel.findOne({ eventId: event._id, userId: (req as any).user.sub }).lean()
    : null;
  return ok(res, { ...host, viewer: { rsvp } });
}));

/* ─── Create ─── */

const CreateDto = z.object({
  title: z.string().min(4).max(140),
  type: z.enum(EVENT_TYPES),
  description: z.string().max(12000).optional(),
  banner: z.string().url().optional(),
  accent: z.string().optional(),
  hostType: z.enum(HOST_TYPES),
  hostSlug: z.string().optional(), // community slug (or 'me' for user-hosted)
  online: z.boolean().default(true),
  location: z.string().optional(),
  timezone: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.number().int().min(0).max(1_000_000).default(0),
  rsvpDeadline: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
  speakers: z.array(z.object({
    userId: z.string().optional(),
    name: z.string(),
    title: z.string().optional(),
    avatar: z.string().url().optional()
  })).max(20).optional(),
  prizes: z.array(z.object({
    rank: z.number().int().optional(),
    title: z.string(),
    value: z.string().optional(),
    description: z.string().optional()
  })).max(10).optional(),
  sponsors: z.array(z.object({ name: z.string(), logo: z.string().url().optional(), url: z.string().url().optional() })).max(15).optional(),
  rules: z.array(z.string()).max(15).optional()
});

eventRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = CreateDto.parse(req.body);

  let hostId: mongoose.Types.ObjectId;
  let hostRef = 'User';
  if (data.hostType === 'community') {
    if (!data.hostSlug) throw new HttpError(400, 'NO_HOST', 'hostSlug required');
    const c = await CommunityModel.findOne({ slug: data.hostSlug }).select('_id ownerId').lean();
    if (!c) throw new HttpError(404, 'NOT_FOUND', 'Community');
    const m = await MembershipModel.findOne({ communityId: c._id, userId: req.user!.sub }).lean();
    if (!m || !['owner', 'admin'].includes(m.role)) throw new HttpError(403, 'FORBIDDEN', 'Admin only');
    hostId = c._id as any;
    hostRef = 'Community';
  } else {
    hostId = new ObjectId(req.user!.sub);
    hostRef = 'User';
  }

  const baseSlug = slugify(data.title);
  let slug = baseSlug; let n = 1;
  while (await EventModel.exists({ slug })) slug = `${baseSlug}-${++n}`;

  const event = await EventModel.create({
    ...data, slug,
    hostId, hostRef,
    createdBy: req.user!.sub,
    startsAt: new Date(data.startsAt),
    endsAt: new Date(data.endsAt),
    rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : undefined
  });

  // Auto-RSVP creator as organizer
  await RsvpModel.create({
    eventId: event._id, userId: req.user!.sub,
    status: 'going', role: 'organizer'
  });
  await EventModel.updateOne({ _id: event._id }, { $inc: { 'counts.going': 1 } });

  // Push to community members
  if (event.hostType === 'community') {
    const members = await MembershipModel.find({ communityId: event.hostId, bannedAt: null }).select('userId').lean();
    const io = getIO();
    members.forEach((m) => {
      if (String(m.userId) === req.user!.sub) return;
      io?.to(`user:${m.userId}`).emit('notif:push', { type: 'event', kind: 'new', eventId: String(event._id), title: event.title });
    });
  }

  return created(res, event);
}));

eventRouter.patch('/:id', authRequired, asyncHandler(async (req, res) => {
  if (!await canManage(req.params.id, req.user!.sub)) {
    throw new HttpError(403, 'FORBIDDEN', 'Cannot edit');
  }
  const data = CreateDto.partial().parse(req.body);
  const update: any = { ...data };
  if (data.startsAt) update.startsAt = new Date(data.startsAt);
  if (data.endsAt) update.endsAt = new Date(data.endsAt);
  if (data.rsvpDeadline) update.rsvpDeadline = new Date(data.rsvpDeadline);
  const ev = await EventModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  return ok(res, ev);
}));

eventRouter.post('/:id/cancel', authRequired, asyncHandler(async (req, res) => {
  if (!await canManage(req.params.id, req.user!.sub)) {
    throw new HttpError(403, 'FORBIDDEN', 'Cannot cancel');
  }
  const ev = await EventModel.findByIdAndUpdate(req.params.id, { $set: { status: 'cancelled' } }, { new: true }).lean();
  // Notify attendees
  const rsvps = await RsvpModel.find({ eventId: req.params.id, status: { $in: ['going', 'maybe'] } }).select('userId').lean();
  const io = getIO();
  for (const r of rsvps) {
    await NotificationModel.create({ userId: r.userId, type: 'job-match', payload: { kind: 'event-cancelled', eventId: req.params.id, title: ev?.title }, read: false });
    io?.to(`user:${r.userId}`).emit('notif:push', { type: 'event', kind: 'cancelled', eventId: req.params.id });
  }
  return ok(res, ev);
}));

/* ─── RSVP ─── */

const RsvpDto = z.object({
  status: z.enum(RSVP_STATUSES).default('going')
});

eventRouter.post('/:id/rsvp', authRequired, asyncHandler(async (req, res) => {
  const { status } = RsvpDto.parse(req.body);
  const event = await EventModel.findById(req.params.id);
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event');
  if (event.status !== 'published') throw new HttpError(400, 'NOT_OPEN', 'Event not open');

  const existing = await RsvpModel.findOne({ eventId: event._id, userId: req.user!.sub });

  // Capacity handling for "going"
  let final = status;
  if (status === 'going' && event.capacity && event.counts.going >= event.capacity) {
    final = 'waitlist';
  }

  if (existing) {
    const before = existing.status;
    existing.status = final as any;
    await existing.save();
    if (before !== final) {
      await EventModel.updateOne({ _id: event._id }, {
        $inc: { [`counts.${before}`]: -1, [`counts.${final}`]: 1 }
      });
    }
    return ok(res, { status: final });
  }
  await RsvpModel.create({ eventId: event._id, userId: req.user!.sub, status: final, role: 'attendee' });
  await EventModel.updateOne({ _id: event._id }, { $inc: { [`counts.${final}`]: 1 } });
  return created(res, { status: final });
}));

eventRouter.delete('/:id/rsvp', authRequired, asyncHandler(async (req, res) => {
  const existing = await RsvpModel.findOneAndDelete({ eventId: req.params.id, userId: req.user!.sub });
  if (existing) {
    await EventModel.updateOne({ _id: req.params.id }, { $inc: { [`counts.${existing.status}`]: -1 } });
    // Promote first waitlist member to going if there's room
    const ev = await EventModel.findById(req.params.id).lean();
    if (ev && ev.capacity && ev.counts.going < ev.capacity && ev.counts.waitlist > 0) {
      const next = await RsvpModel.findOneAndUpdate(
        { eventId: req.params.id, status: 'waitlist' },
        { $set: { status: 'going' } },
        { sort: { createdAt: 1 } }
      );
      if (next) {
        await EventModel.updateOne({ _id: req.params.id }, {
          $inc: { 'counts.waitlist': -1, 'counts.going': 1 }
        });
        getIO()?.to(`user:${next.userId}`).emit('notif:push', {
          type: 'event', kind: 'waitlist-promoted', eventId: req.params.id
        });
      }
    }
  }
  return ok(res, { ok: true });
}));

eventRouter.get('/:id/attendees', asyncHandler(async (req, res) => {
  const rsvps = await RsvpModel.find({ eventId: req.params.id, status: { $in: ['going', 'maybe'] } })
    .sort({ createdAt: 1 }).limit(200).lean();
  const users = await UserModel.find({ _id: { $in: rsvps.map((r) => r.userId) } })
    .select('handle name avatar headline').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return ok(res, rsvps.map((r) => ({ ...r, user: byId.get(String(r.userId)) })));
}));

/* ─── Announcements ─── */

eventRouter.get('/:id/announcements', asyncHandler(async (req, res) => {
  const list = await EventAnnouncementModel.find({ eventId: req.params.id })
    .sort({ pinned: -1, createdAt: -1 }).limit(40).lean();
  const ids = [...new Set(list.map((a) => String(a.authorId)))];
  const users = await UserModel.find({ _id: { $in: ids } }).select('handle name avatar').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return ok(res, list.map((a) => ({ ...a, author: byId.get(String(a.authorId)) })));
}));

const AnnouncementDto = z.object({
  content: z.string().min(1).max(4000),
  pinned: z.boolean().default(false)
});

eventRouter.post('/:id/announcements', authRequired, asyncHandler(async (req, res) => {
  if (!await canManage(req.params.id, req.user!.sub)) {
    throw new HttpError(403, 'FORBIDDEN', 'Organizer only');
  }
  const data = AnnouncementDto.parse(req.body);
  const a = await EventAnnouncementModel.create({ eventId: req.params.id, authorId: req.user!.sub, ...data });

  // Fan-out to attendees
  const rsvps = await RsvpModel.find({ eventId: req.params.id, status: { $in: ['going', 'maybe'] } }).select('userId').lean();
  const io = getIO();
  rsvps.forEach((r) => {
    io?.to(`user:${r.userId}`).emit('notif:push', { type: 'event', kind: 'announcement', eventId: req.params.id });
  });
  return created(res, a);
}));

/* ─── Hydration ─── */

async function hydrate(events: any[]): Promise<any[]> {
  if (!events.length) return [];
  const communityIds = events.filter((e) => e.hostType === 'community').map((e) => e.hostId);
  const userIds = events.filter((e) => e.hostType === 'user' || e.hostType === 'university').map((e) => e.hostId);
  const [communities, users] = await Promise.all([
    communityIds.length ? CommunityModel.find({ _id: { $in: communityIds } }).select('name slug icon accent').lean() : Promise.resolve([]),
    userIds.length ? UserModel.find({ _id: { $in: userIds } }).select('handle name avatar universityName').lean() : Promise.resolve([])
  ]);
  const byCommunity = new Map(communities.map((c) => [String(c._id), c]));
  const byUser = new Map(users.map((u) => [String(u._id), u]));
  return events.map((e) => ({
    ...e,
    host: e.hostType === 'community' ? byCommunity.get(String(e.hostId)) : byUser.get(String(e.hostId))
  }));
}
