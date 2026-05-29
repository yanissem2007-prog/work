import mongoose from 'mongoose';
import { NotificationModel, NotificationPrefsModel, type NotificationType, type NotificationCategory } from './notifications.model';
import { getIO } from '../../sockets/registry';
import { logger } from '../../config/logger';

const CATEGORY_OF: Record<NotificationType, NotificationCategory> = {
  like: 'social', comment: 'social', follow: 'social',
  friend_request: 'social', friend_accepted: 'social',
  message: 'messages', chat_mention: 'messages',
  community_invited: 'communities', community_announcement: 'communities',
  job_match: 'jobs', job_application: 'jobs', application_status: 'jobs',
  event_new: 'events', event_reminder: 'events', event_announcement: 'events', event_cancelled: 'events',
  order_new: 'system', order_delivered: 'system', order_completed: 'system',
  review_new: 'system',
  badge_unlocked: 'system', level_up: 'system',
  system: 'system'
};

const GROUP_WINDOW_MS = 60 * 60 * 1000; // collapse same-type+target within 1 hour

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  actorId?: string;
  title?: string;
  body?: string;
  target?: { kind: string; id?: string; slug?: string };
  href?: string;
  groupable?: boolean;
}

/**
 * Create + emit a notification. If `groupable` and a recent matching row exists
 * (same userId+type+target within window), bump its counter and add the actor.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    if (input.userId === input.actorId) return; // don't notify self

    const prefs = await NotificationPrefsModel.findOne({ userId: input.userId }).lean();
    if (prefs?.mutedUntil && prefs.mutedUntil > new Date()) return;
    if (prefs?.push && prefs.push.get(input.type) === false) return;

    const category = CATEGORY_OF[input.type] ?? 'system';
    const groupable = input.groupable ?? defaultGroupable(input.type);
    const groupKey = groupable
      ? `${input.type}:${input.target?.kind ?? '_'}:${input.target?.id ?? input.target?.slug ?? '_'}`
      : undefined;

    let doc;
    if (groupKey) {
      const since = new Date(Date.now() - GROUP_WINDOW_MS);
      doc = await NotificationModel.findOneAndUpdate(
        { userId: input.userId, groupKey, lastAt: { $gte: since }, archived: false },
        {
          $set: { lastAt: new Date(), read: false, title: input.title, href: input.href, category },
          $inc: { groupCount: 1 },
          $addToSet: input.actorId ? { actorIds: input.actorId as any } : {}
        },
        { new: true }
      );
    }

    if (!doc) {
      doc = await NotificationModel.create({
        userId: input.userId,
        type: input.type,
        category,
        actorId: input.actorId,
        actorIds: input.actorId ? [input.actorId] : [],
        title: input.title,
        body: input.body,
        target: input.target,
        groupKey,
        groupCount: 1,
        lastAt: new Date(),
        href: input.href,
        read: false
      });
    }

    getIO()?.to(`user:${input.userId}`).emit('notif:push', {
      id: String(doc._id),
      type: doc.type,
      category: doc.category,
      title: doc.title,
      body: doc.body,
      href: doc.href,
      target: doc.target,
      groupCount: doc.groupCount,
      lastAt: doc.lastAt
    });
  } catch (e) {
    logger.error(e, 'notify failed');
  }
}

function defaultGroupable(type: NotificationType): boolean {
  return [
    'like', 'comment', 'follow', 'friend_request',
    'community_announcement', 'event_announcement', 'event_reminder',
    'review_new', 'job_match'
  ].includes(type);
}
