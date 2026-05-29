import mongoose from 'mongoose';
import { UserModel } from '../auth/auth.model';
import { CoachSessionModel } from '../coach/coach.model';
import { RoadmapModel } from '../roadmap/roadmap.model';
import { EventModel, RsvpModel } from '../events/events.model';
import { ProfileGameModel, XpEventModel } from '../gamification/gamification.model';
import { NotificationPrefsModel } from '../notifications/notifications.model';
import { matchService } from '../match/match.service';
import { sendMail } from '../otp/mail.service';
import { renderDigestEmail, type DigestPayload } from './digest.template';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://work.app';

/** Build the per-user digest payload, pulling from coach/roadmap/events/xp/matches. */
async function buildPayload(userId: string, name: string): Promise<DigestPayload | null> {
  const since = new Date(Date.now() - 7 * 86_400_000);

  const [game, xpRows, sessions, roadmaps, rsvps] = await Promise.all([
    ProfileGameModel.findOne({ userId }).lean(),
    XpEventModel.find({ userId, createdAt: { $gte: since } }).select('xp').lean(),
    CoachSessionModel.find({ userId, status: 'active' }).select('plan').limit(3).lean(),
    RoadmapModel.find({ userId }).select('phases').limit(3).lean(),
    RsvpModel.find({ userId, status: { $in: ['going', 'maybe'] } })
      .sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const xpThisWeek = xpRows.reduce((s, e) => s + (e.xp ?? 0), 0);

  // Upcoming steps from coach sessions + roadmap phases.
  const inSevenDays = new Date(Date.now() + 7 * 86_400_000);
  const upcomingSteps: DigestPayload['upcomingSteps'] = [];
  for (const s of sessions) {
    for (const step of (s.plan ?? []) as any[]) {
      if (!step.done && step.due && new Date(step.due) <= inSevenDays) {
        upcomingSteps.push({
          title: step.title,
          due: new Date(step.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        });
      }
    }
  }
  for (const rm of roadmaps) {
    for (const phase of (rm.phases ?? []) as any[]) {
      for (const step of (phase.steps ?? [])) {
        if (!step.done) upcomingSteps.push({ title: `${phase.title} · ${step.title}`, due: 'this week' });
      }
    }
  }
  const trimmedSteps = upcomingSteps.slice(0, 5);

  // Job matches (top 3)
  let topMatches: DigestPayload['topMatches'] = [];
  try {
    const m = await matchService.topForUser(userId, 3);
    topMatches = m.map((x: any) => ({
      title: x.job?.title ?? 'Role',
      company: x.job?.company?.name,
      href: `${SITE}/jobs/${x.jobId ?? x.job?._id}`
    }));
  } catch (e) {
    logger.debug(e, 'digest match lookup failed');
  }

  // Events
  const eventIds = rsvps.map((r) => r.eventId);
  const upcomingEvents: DigestPayload['upcomingEvents'] = [];
  if (eventIds.length) {
    const events = await EventModel.find({
      _id: { $in: eventIds },
      status: 'published',
      startsAt: { $gte: new Date() }
    }).sort({ startsAt: 1 }).limit(3).lean();
    for (const e of events) {
      upcomingEvents.push({
        title: e.title,
        when: new Date(e.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
        href: `${SITE}/events/${e.slug}`
      });
    }
  }

  // Skip the email if there is genuinely nothing to say AND no XP earned.
  if (
    !xpThisWeek && trimmedSteps.length === 0 && topMatches.length === 0 && upcomingEvents.length === 0
  ) return null;

  return {
    name,
    level: game?.level ?? 1,
    xpThisWeek,
    streak: game?.streak?.current ?? 0,
    upcomingSteps: trimmedSteps,
    topMatches,
    upcomingEvents,
    loginHref: `${SITE}/home`
  };
}

/** Send a digest to one user. Honors mute + per-type email pref. */
export async function sendDigestForUser(userId: string): Promise<boolean> {
  const user = await UserModel.findById(userId).select('email name').lean();
  if (!user?.email) return false;

  const prefs = await NotificationPrefsModel.findOne({ userId }).lean();
  if (prefs?.mutedUntil && new Date(prefs.mutedUntil) > new Date()) return false;
  if (prefs?.email && prefs.email.get('digest') === false) return false;

  const payload = await buildPayload(userId, user.name ?? 'there');
  if (!payload) return false;

  const { subject, html, text } = renderDigestEmail(payload);
  await sendMail({ to: user.email, subject, html, text });
  return true;
}

/** Fan out the digest to every active user. */
export async function runWeeklyDigest(): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;
  // Stream users to avoid loading everything in memory.
  const cursor = UserModel.find({ status: 'active' }).select('_id').cursor();
  for await (const u of cursor) {
    try {
      if (await sendDigestForUser(String(u._id))) sent++;
      else skipped++;
    } catch (e) {
      skipped++;
      logger.error(e, `digest send failed for ${u._id}`);
    }
  }
  logger.info({ sent, skipped }, 'weekly digest complete');
  return { sent, skipped };
}

/* ─── Cron loop: every Sunday 12:00 UTC ─── */

let timer: NodeJS.Timeout | null = null;

function msUntilNextSundayNoonUtc(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  // Day of week: 0 = Sunday.
  const daysAhead = (7 - next.getUTCDay()) % 7;
  if (daysAhead === 0 && next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  } else {
    next.setUTCDate(next.getUTCDate() + daysAhead);
  }
  return next.getTime() - now.getTime();
}

export function startDigestLoop(): void {
  if (timer) return;
  if (env.NODE_ENV !== 'production' && process.env.RUN_DIGEST_LOOP !== 'true') {
    logger.info('digest loop disabled in dev (set RUN_DIGEST_LOOP=true to enable)');
    return;
  }
  const schedule = () => {
    const wait = msUntilNextSundayNoonUtc();
    logger.info(`next digest fan-out in ${(wait / 3600_000).toFixed(1)}h`);
    timer = setTimeout(async () => {
      try { await runWeeklyDigest(); } finally { schedule(); }
    }, wait);
  };
  schedule();
}

export function stopDigestLoop(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}
