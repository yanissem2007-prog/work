import { Router } from 'express';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { buildHomeFeed } from './home.service';

export const homeRouter = Router();

homeRouter.get('/feed', authRequired, asyncHandler(async (req, res) => {
  const cursor = (req.query.cursor as string) || undefined;
  const feed = await buildHomeFeed(req.user!.sub, cursor);
  return ok(res, feed.items, { cursor: feed.cursor });
}));
