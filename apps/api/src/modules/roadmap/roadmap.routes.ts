import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { RoadmapModel } from './roadmap.model';
import { generateRoadmap, progressOf } from './roadmap.service';

const tight = rateLimit({ windowMs: 60_000, max: 6 });
export const roadmapRouter = Router();

const GenDto = z.object({
  goal: z.string().min(6).max(200),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  hoursPerWeek: z.number().int().min(2).max(60).optional()
});

roadmapRouter.post('/generate', authRequired, tight, asyncHandler(async (req, res) => {
  const data = GenDto.parse(req.body);
  const rm = await generateRoadmap({ ...data, userId: req.user!.sub });
  const stepsTotal = rm.phases.reduce((n, p) => n + p.steps.length, 0);
  const saved = await RoadmapModel.create({
    userId: req.user!.sub, goal: data.goal, level: data.level,
    ...rm, progress: { stepsTotal, stepsDone: 0 }
  });
  return created(res, saved);
}));

roadmapRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const list = await RoadmapModel.find({ userId: req.user!.sub })
    .sort({ updatedAt: -1 }).select('-phases').lean();
  return ok(res, list);
}));

roadmapRouter.get('/:id', authRequired, asyncHandler(async (req, res) => {
  const rm = await RoadmapModel.findOne({ _id: req.params.id, userId: req.user!.sub }).lean();
  if (!rm) throw new HttpError(404, 'NOT_FOUND', 'Roadmap');
  return ok(res, rm);
}));

const StepPatchDto = z.object({ done: z.boolean() });

roadmapRouter.patch('/:id/phases/:phaseId/steps/:stepId', authRequired, asyncHandler(async (req, res) => {
  const { done } = StepPatchDto.parse(req.body);
  const rm = await RoadmapModel.findOne({ _id: req.params.id, userId: req.user!.sub });
  if (!rm) throw new HttpError(404, 'NOT_FOUND', 'Roadmap');
  const phase = rm.phases.find((p: any) => p.id === req.params.phaseId);
  const step = phase?.steps.find((s: any) => s.id === req.params.stepId);
  if (!phase || !step) throw new HttpError(404, 'NOT_FOUND', 'Step');
  step.done = done;
  step.doneAt = done ? new Date() : undefined;
  const progress = progressOf(rm);
  rm.progress = progress as any;
  await rm.save();
  return ok(res, { progress, step });
}));

roadmapRouter.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  await RoadmapModel.deleteOne({ _id: req.params.id, userId: req.user!.sub });
  return ok(res, { ok: true });
}));
