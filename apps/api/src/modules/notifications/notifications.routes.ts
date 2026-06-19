import { Router } from 'express';
import { z } from 'zod';
import {
  NotificationModel, NotificationPrefsModel,
  NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES
} from './notifications.model';
import { UserModel } from '../auth/auth.model';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';

export const notificationRouter = Router();

notificationRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { userId: req.user!.sub, archived: false };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.unread === 'true') filter.read = false;

  const limit = Math.min(80, Number(req.query.limit ?? 40));
  const list = await NotificationModel.find(filter)
    .sort({ lastAt: -1, createdAt: -1 }).limit(limit).lean();

  // Hydrate actors for previews
  const actorIds = [...new Set(list.flatMap((n) => [n.actorId, ...(n.actorIds ?? [])])
    .filter(Boolean).map(String))];
  const actors = await UserModel.find({ _id: { $in: actorIds } })
    .select('handle name avatar').lean();
  const byId = new Map(actors.map((a) => [String(a._id), a]));

  return ok(res, list.map((n) => ({
    ...n,
    actor: n.actorId ? byId.get(String(n.actorId)) : null,
    actors: (n.actorIds ?? []).map((id) => byId.get(String(id))).filter(Boolean)
  })));
}));

notificationRouter.get('/counts', authRequired, asyncHandler(async (req, res) => {
  const userId = req.user!.sub;
  const [total, byCategory] = await Promise.all([
    NotificationModel.countDocuments({ userId, read: false, archived: false }),
    NotificationModel.aggregate([
      { $match: { userId: new (await import('mongoose')).Types.ObjectId(userId), read: false, archived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
  ]);
  const cat = Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c, 0]));
  byCategory.forEach((b) => { cat[b._id] = b.count; });
  return ok(res, { total, byCategory: cat });
}));

notificationRouter.patch('/read', authRequired, asyncHandler(async (req, res) => {
  const ids = z.array(z.string()).default([]).parse(req.body?.ids);
  const filter: Record<string, unknown> = { userId: req.user!.sub };
  if (ids.length) filter._id = { $in: ids };
  await NotificationModel.updateMany(filter, { $set: { read: true } });
  return ok(res, { ok: true });
}));

notificationRouter.patch('/:id', authRequired, asyncHandler(async (req, res) => {
  const update: Record<string, unknown> = {};
  if (typeof req.body?.read === 'boolean') update.read = req.body.read;
  if (typeof req.body?.archived === 'boolean') update.archived = req.body.archived;
  const n = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub },
    { $set: update },
    { new: true }
  );
  return ok(res, n);
}));

notificationRouter.delete('/', authRequired, asyncHandler(async (req, res) => {
  await NotificationModel.updateMany(
    { userId: req.user!.sub },
    { $set: { archived: true } }
  );
  return ok(res, { ok: true });
}));

/* ─── Preferences ─── */
const PrefDto = z.object({
  push: z.record(z.boolean()).optional(),
  email: z.record(z.boolean()).optional(),
  mutedHours: z.number().int().min(0).max(720).optional()
});

notificationRouter.get('/prefs', authRequired, asyncHandler(async (req, res) => {
  let prefs: any = await NotificationPrefsModel.findOne({ userId: req.user!.sub }).lean();
  if (!prefs) {
    const created = await NotificationPrefsModel.create({ userId: req.user!.sub });
    prefs = created.toObject();
  }
  return ok(res, { ...prefs, types: NOTIFICATION_TYPES });
}));

notificationRouter.patch('/prefs', authRequired, asyncHandler(async (req, res) => {
  const data = PrefDto.parse(req.body);
  const update: Record<string, unknown> = {};
  if (data.push) update.push = data.push;
  if (data.email) update.email = data.email;
  if (typeof data.mutedHours === 'number') {
    update.mutedUntil = data.mutedHours > 0
      ? new Date(Date.now() + data.mutedHours * 3_600_000)
      : null;
  }
  const prefs = await NotificationPrefsModel.findOneAndUpdate(
    { userId: req.user!.sub },
    { $set: update },
    { new: true, upsert: true }
  ).lean();
  return ok(res, prefs);
}));
