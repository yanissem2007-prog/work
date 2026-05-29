import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { trendingService } from './trending.service';
import { getIO } from '../../sockets/registry';
import { logger } from '../../config/logger';

export const trendingRouter = Router();

trendingRouter.get('/', asyncHandler(async (_req, res) => {
  const overview = await trendingService.getOverview();
  return ok(res, overview);
}));

trendingRouter.get('/posts', asyncHandler(async (_req, res) => ok(res, (await trendingService.getOverview()).posts)));
trendingRouter.get('/jobs', asyncHandler(async (_req, res) => ok(res, (await trendingService.getOverview()).jobs)));
trendingRouter.get('/skills', asyncHandler(async (_req, res) => ok(res, (await trendingService.getOverview()).skills)));
trendingRouter.get('/technologies', asyncHandler(async (_req, res) => ok(res, (await trendingService.getOverview()).technologies)));
trendingRouter.get('/communities', asyncHandler(async (_req, res) => ok(res, (await trendingService.getOverview()).communities)));

/* ─── Broadcast tick ─── */

let timer: NodeJS.Timeout | null = null;

export async function broadcastTrending(): Promise<void> {
  try {
    const overview = await trendingService.getOverview(true);
    getIO()?.emit('trending:update', overview);
  } catch (e) {
    logger.error(e, 'broadcastTrending failed');
  }
}

export function startTrendingLoop(): void {
  if (timer) return;
  void broadcastTrending();
  timer = setInterval(() => { void broadcastTrending(); }, 60_000);
  logger.info('trending loop started (every 60s)');
}

export function stopTrendingLoop(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
