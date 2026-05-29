import { EventModel, RsvpModel } from './events.model';
import { NotificationModel } from '../notifications/notifications.model';
import { getIO } from '../../sockets/registry';
import { logger } from '../../config/logger';

type Window = '24h' | '1h' | 'live';

const WINDOWS: { key: Window; minMs: number; maxMs: number }[] = [
  { key: '24h',  minMs: 23.5 * 3600_000, maxMs: 24.5 * 3600_000 },
  { key: '1h',   minMs: 0.5  * 3600_000, maxMs: 1.5  * 3600_000 },
  { key: 'live', minMs: -10  * 60_000,   maxMs: 5    * 60_000   }
];

async function fanOut(eventId: string, eventTitle: string, kind: Window) {
  const rsvps = await RsvpModel.find({ eventId, status: { $in: ['going', 'maybe'] } }).select('userId').lean();
  const io = getIO();
  for (const r of rsvps) {
    await NotificationModel.create({
      userId: r.userId, type: 'job-match',
      payload: { kind: 'event-reminder', eventId, title: eventTitle, window: kind },
      read: false
    });
    io?.to(`user:${r.userId}`).emit('notif:push', {
      type: 'event', kind: `reminder-${kind}`, eventId, title: eventTitle
    });
  }
}

/**
 * Tick once per minute. Idempotent: fires each window at most once per event
 * using `reminderSent` map on the event doc.
 */
export async function tickReminders(): Promise<void> {
  try {
    const now = Date.now();
    for (const w of WINDOWS) {
      const start = new Date(now + w.minMs);
      const end = new Date(now + w.maxMs);
      const events = await EventModel.find({
        status: 'published',
        startsAt: { $gte: start, $lte: end },
        [`reminderSent.${w.key}`]: { $ne: true }
      }).select('_id title').lean();

      for (const e of events) {
        await fanOut(String(e._id), e.title, w.key);
        await EventModel.updateOne({ _id: e._id }, { $set: { [`reminderSent.${w.key}`]: true } });
      }
    }
  } catch (e) {
    logger.error(e, 'event reminders tick failed');
  }
}

let timer: NodeJS.Timeout | null = null;

export function startReminderLoop(): void {
  if (timer) return;
  // Fire once on boot, then every minute.
  void tickReminders();
  timer = setInterval(() => { void tickReminders(); }, 60_000);
  logger.info('event reminder loop started (every 60s)');
}

export function stopReminderLoop(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
