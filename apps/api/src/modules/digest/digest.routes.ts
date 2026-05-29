import { Router } from 'express';
import { authRequired } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { runWeeklyDigest, sendDigestForUser } from './digest.service';

export const digestRouter = Router();

/** Send the digest to the calling user immediately — useful for QA/preview. */
digestRouter.post('/me', authRequired, asyncHandler(async (req, res) => {
  const sent = await sendDigestForUser(req.user!.sub);
  return ok(res, { sent });
}));

/** Admin: force fan-out to everyone (use with care). */
digestRouter.post('/run', authRequired, requirePermission('*'),
  asyncHandler(async (_req, res) => {
    const result = await runWeeklyDigest();
    return ok(res, result);
  })
);
