import { XP_EVENTS, BADGES, levelFromXp, type XpEventId } from './catalog';
import { XpEventModel, ProfileGameModel } from './gamification.model';
import { getIO } from '../../sockets/registry';
import { NotificationModel } from '../notifications/notifications.model';
import { logger } from '../../config/logger';

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export interface AwardResult {
  awarded: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  newBadges: string[];
}

/**
 * Award XP for an event. Idempotent for `oncePerLife`. Respects `dailyCap`.
 * Atomic-ish: profile aggregate doc is upserted; events are write-then-aggregate.
 */
export async function awardXp(
  userId: string,
  type: XpEventId,
  meta?: Record<string, unknown>
): Promise<AwardResult | null> {
  const rule = XP_EVENTS[type];
  if (!rule) return null;
  try {
    // Cooldown / cap checks
    if ('oncePerLife' in rule && rule.oncePerLife) {
      const exists = await XpEventModel.exists({ userId, type });
      if (exists) return null;
    }
    if ('dailyCap' in rule && rule.dailyCap) {
      const since = new Date(); since.setUTCHours(0, 0, 0, 0);
      const earnedToday = await XpEventModel.aggregate([
        { $match: { userId: typeof userId === 'string' ? new (await import('mongoose')).Types.ObjectId(userId) : userId, type, createdAt: { $gte: since } } },
        { $group: { _id: null, sum: { $sum: '$xp' } } }
      ]);
      const got = earnedToday[0]?.sum ?? 0;
      if (got >= rule.dailyCap) return null;
    }

    await XpEventModel.create({ userId, type, xp: rule.xp, meta });

    // Update aggregate profile
    const profile = await ProfileGameModel.findOneAndUpdate(
      { userId },
      {
        $inc: { totalXp: rule.xp, [`counts.${type}`]: 1 }
      },
      { new: true, upsert: true }
    );

    // Streak — every awarded event counts as "active today"
    const today = dayKey();
    const last = profile.streak?.lastActiveDay;
    if (last !== today) {
      const yesterday = dayKey(new Date(Date.now() - 86_400_000));
      const next = last === yesterday ? (profile.streak.current ?? 0) + 1 : 1;
      profile.streak = {
        current: next,
        best: Math.max(profile.streak?.best ?? 0, next),
        lastActiveDay: today
      } as any;
    }

    // Level
    const prevLevel = profile.level ?? 1;
    const { level } = levelFromXp(profile.totalXp);
    profile.level = level;
    const leveledUp = level > prevLevel;

    // Badges
    const stats = {
      level: profile.level,
      totalXp: profile.totalXp,
      counts: Object.fromEntries(profile.counts ?? new Map()) as any,
      bestStreak: profile.streak.best ?? 0,
      currentStreak: profile.streak.current ?? 0,
      interviews: profile.interviews ?? { count: 0, bestScore: 0 }
    } as any;
    const owned = new Set((profile.badges ?? []).map((b: any) => b.id));
    const newBadges: string[] = [];
    for (const b of BADGES) {
      if (!owned.has(b.id) && b.check(stats)) {
        profile.badges.push({ id: b.id, awardedAt: new Date() } as any);
        newBadges.push(b.id);
      }
    }

    await profile.save();

    // Side effects: notification + socket push
    const io = getIO();
    if (leveledUp) {
      await NotificationModel.create({ userId, type: 'job-match', payload: { kind: 'level-up', level }, read: false });
      io?.to(`user:${userId}`).emit('notif:push', { kind: 'gamification', event: 'level-up', level });
    }
    for (const id of newBadges) {
      const def = BADGES.find((b) => b.id === id);
      await NotificationModel.create({ userId, type: 'job-match', payload: { kind: 'badge', badge: def }, read: false });
      io?.to(`user:${userId}`).emit('notif:push', { kind: 'gamification', event: 'badge', badge: def });
    }
    io?.to(`user:${userId}`).emit('xp:awarded', { type, xp: rule.xp, totalXp: profile.totalXp, level: profile.level });

    return {
      awarded: rule.xp,
      totalXp: profile.totalXp,
      level: profile.level,
      leveledUp,
      newBadges
    };
  } catch (e) {
    logger.error(e, `xp award failed (${type})`);
    return null;
  }
}

/** Bump interview stats and trigger badge check. */
export async function recordInterview(userId: string, score: number) {
  const profile = await ProfileGameModel.findOneAndUpdate(
    { userId },
    { $inc: { 'interviews.count': 1 }, $max: { 'interviews.bestScore': score } },
    { new: true, upsert: true }
  );
  await awardXp(userId, 'interview.complete');
  if (score >= 90) await awardXp(userId, 'interview.score90');
  return profile;
}
