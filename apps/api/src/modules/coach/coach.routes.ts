import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { CoachSessionModel, COACH_FOCUS } from './coach.model';
import { generatePlan, generateCheckInInsight, addIds } from './coach.service';

export const coachRouter = Router();

const StartDto = z.object({
  focus: z.enum(COACH_FOCUS),
  goal: z.string().min(6).max(280),
  horizonWeeks: z.number().int().min(2).max(52).default(12)
});

coachRouter.post('/sessions', authRequired, asyncHandler(async (req, res) => {
  const data = StartDto.parse(req.body);
  const plan = await generatePlan({ userId: req.user!.sub, ...data });
  const withIds = addIds(plan);
  const session = await CoachSessionModel.create({
    userId: req.user!.sub,
    focus: data.focus, goal: data.goal, horizonWeeks: data.horizonWeeks,
    summary: withIds.summary,
    plan: withIds.plan,
    insights: withIds.insights
  });
  return created(res, session);
}));

coachRouter.get('/sessions', authRequired, asyncHandler(async (req, res) => {
  const list = await CoachSessionModel.find({ userId: req.user!.sub })
    .sort({ updatedAt: -1 }).limit(20).lean();
  return ok(res, list);
}));

coachRouter.get('/sessions/:id', authRequired, asyncHandler(async (req, res) => {
  const s = await CoachSessionModel.findOne({ _id: req.params.id, userId: req.user!.sub }).lean();
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Session');
  return ok(res, s);
}));

coachRouter.patch('/sessions/:id/plan/:stepId', authRequired, asyncHandler(async (req, res) => {
  const done = z.boolean().parse(req.body?.done);
  const s = await CoachSessionModel.findOne({ _id: req.params.id, userId: req.user!.sub });
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Session');
  const step = s.plan.find((p: any) => p.id === req.params.stepId);
  if (!step) throw new HttpError(404, 'NOT_FOUND', 'Step');
  step.done = done;
  step.doneAt = done ? new Date() : undefined;
  await s.save();
  return ok(res, { ok: true });
}));

const CheckInDto = z.object({
  mood: z.enum(['stuck', 'okay', 'great']),
  win: z.string().max(280).optional(),
  block: z.string().max(280).optional(),
  next: z.string().max(280).optional()
});

coachRouter.post('/sessions/:id/check-in', authRequired, asyncHandler(async (req, res) => {
  const data = CheckInDto.parse(req.body);
  const s = await CoachSessionModel.findOne({ _id: req.params.id, userId: req.user!.sub });
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Session');
  const insight = await generateCheckInInsight({ goal: s.goal, focus: s.focus as any, recent: data });
  s.checkIns.push({ at: new Date(), ...data, insight } as any);
  await s.save();
  return created(res, { insight, count: s.checkIns.length });
}));

coachRouter.post('/sessions/:id/complete', authRequired, asyncHandler(async (req, res) => {
  await CoachSessionModel.updateOne(
    { _id: req.params.id, userId: req.user!.sub },
    { $set: { status: 'completed', completedAt: new Date() } }
  );
  return ok(res, { ok: true });
}));
