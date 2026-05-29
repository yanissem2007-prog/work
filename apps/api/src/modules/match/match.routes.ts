import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { matchService } from './match.service';

export const matchRouter = Router();

matchRouter.get('/for-me', authRequired, asyncHandler(async (req, res) => {
  const limit = Math.min(24, Number(req.query.limit ?? 12));
  const items = await matchService.topForUser(req.user!.sub, limit);
  return ok(res, items);
}));

matchRouter.get('/job/:id', authRequired, asyncHandler(async (req, res) => {
  const r = await matchService.scoreSingle(req.user!.sub, req.params.id);
  return ok(res, r);
}));

const BatchDto = z.object({ jobIds: z.array(z.string()).max(40) });

matchRouter.post('/batch', authRequired, asyncHandler(async (req, res) => {
  const { jobIds } = BatchDto.parse(req.body);
  const ctx = await matchService.buildContextForUser(req.user!.sub);
  const { JobModel } = await import('../jobs/jobs.model');
  const jobs = await JobModel.find({ _id: { $in: jobIds } }).lean();
  const result = jobs.map((j) => matchService.score(ctx, j as any));
  return ok(res, result);
}));
