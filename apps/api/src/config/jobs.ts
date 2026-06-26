import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';
import { logger } from './logger';
import { tickReminders } from '../modules/events/reminders';
import { broadcastTrending } from '../modules/trending/trending.routes';
import { runWeeklyDigest } from '../modules/digest/digest.service';

/**
 * Background jobs on BullMQ instead of in-process setInterval.
 *
 * Why: with N API instances behind a load balancer, setInterval fires on every
 * instance → duplicated work (N× notifications, N× broadcasts). BullMQ job
 * schedulers are deduplicated through Redis, so each tick runs exactly once no
 * matter how many instances are up. The worker runs in-process here (so it can
 * reach Socket.io), but can be split into a dedicated worker dyno later with no
 * code change.
 */

const QUEUE = 'work-jobs';
const JOB_OPTS = { removeOnComplete: { count: 20 }, removeOnFail: { count: 50 } } as const;

// BullMQ needs `maxRetriesPerRequest: null`, AND the Queue and the (blocking)
// Worker must use SEPARATE connections — a shared one deadlocks because the
// worker's BRPOPLPUSH blocks every other command on that socket.
const newConn = () => new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
const queueConn = newConn();
const workerConn = newConn();
const digestEnabled = env.NODE_ENV === 'production' || process.env.RUN_DIGEST_LOOP === 'true';

let queue: Queue | null = null;
let worker: Worker | null = null;

export async function startJobs(): Promise<void> {
  // `as any`: a valid IORedis instance, but BullMQ's bundled types differ.
  queue = new Queue(QUEUE, { connection: queueConn as any });

  // Recurring schedules (deduped across instances).
  await queue.upsertJobScheduler('reminders', { every: 60_000 }, { name: 'reminders', opts: JOB_OPTS });
  await queue.upsertJobScheduler('trending', { every: 60_000 }, { name: 'trending', opts: JOB_OPTS });
  if (digestEnabled) {
    await queue.upsertJobScheduler('digest', { pattern: '0 12 * * 0', tz: 'UTC' }, { name: 'digest', opts: JOB_OPTS });
  } else {
    await queue.removeJobScheduler('digest').catch(() => {});
  }

  // Fire reminders + trending once now so trending is fresh on boot.
  await queue.add('reminders', {}, JOB_OPTS);
  await queue.add('trending', {}, JOB_OPTS);

  worker = new Worker(QUEUE, async (job) => {
    switch (job.name) {
      case 'reminders': return tickReminders();
      case 'trending': return broadcastTrending();
      case 'digest': return runWeeklyDigest();
      default: return;
    }
  }, { connection: workerConn as any, concurrency: 2 });

  worker.on('failed', (job, err) => logger.error(err, `job ${job?.name ?? '?'} failed`));
  logger.info(`BullMQ jobs started (reminders 60s · trending 60s · digest ${digestEnabled ? 'weekly' : 'off'})`);
}

export async function stopJobs(): Promise<void> {
  // force=true: don't wait for an in-flight job to finish — this keeps shutdown
  // (and tsx hot-reload) fast instead of blocking on the worker's BRPOPLPUSH.
  await worker?.close(true).catch(() => {});
  await queue?.close().catch(() => {});
  await queueConn.quit().catch(() => {});
  await workerConn.quit().catch(() => {});
}
