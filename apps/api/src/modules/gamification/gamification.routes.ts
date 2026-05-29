import { Router } from 'express';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { ProfileGameModel, XpEventModel } from './gamification.model';
import { BADGES, XP_EVENTS, levelFromXp } from './catalog';
import { UserModel } from '../auth/auth.model';

export const gamificationRouter = Router();

gamificationRouter.get('/me', authRequired, asyncHandler(async (req, res) => {
  const p = await ProfileGameModel.findOneAndUpdate(
    { userId: req.user!.sub },
    { $setOnInsert: { userId: req.user!.sub } },
    { new: true, upsert: true }
  ).lean();
  const xpInfo = levelFromXp(p.totalXp);
  const ownedIds = new Set((p.badges ?? []).map((b: any) => b.id));
  const badges = BADGES.map((b) => ({
    ...b,
    owned: ownedIds.has(b.id),
    awardedAt: (p.badges ?? []).find((x: any) => x.id === b.id)?.awardedAt,
    check: undefined // strip predicate
  }));
  return ok(res, { profile: p, level: xpInfo, badges });
}));

gamificationRouter.get('/badges', asyncHandler(async (_req, res) => {
  return ok(res, BADGES.map((b) => ({ ...b, check: undefined })));
}));

gamificationRouter.get('/events', authRequired, asyncHandler(async (req, res) => {
  const events = await XpEventModel.find({ userId: req.user!.sub })
    .sort({ createdAt: -1 }).limit(50).lean();
  return ok(res, events);
}));

gamificationRouter.get('/leaderboard', asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit ?? 20));
  const top = await ProfileGameModel.find()
    .sort({ totalXp: -1 }).limit(limit).lean();
  const users = await UserModel.find({ _id: { $in: top.map((t) => t.userId) } })
    .select('handle name avatar headline').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return ok(res, top.map((p, i) => ({
    rank: i + 1,
    totalXp: p.totalXp,
    level: p.level,
    streak: p.streak,
    badges: p.badges?.length ?? 0,
    user: byId.get(String(p.userId))
  })));
}));
