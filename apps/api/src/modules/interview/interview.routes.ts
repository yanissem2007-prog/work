import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import {
  InterviewModel, INTERVIEW_CATEGORIES, INTERVIEW_LEVELS
} from './interview.model';
import { interviewService } from './interview.service';
import { recordInterview } from '../gamification/xp.service';

export const interviewRouter = Router();

const StartDto = z.object({
  category: z.enum(INTERVIEW_CATEGORIES),
  level: z.enum(INTERVIEW_LEVELS).default('mid'),
  jobTitle: z.string().max(120).optional(),
  totalQuestions: z.number().int().min(3).max(10).default(6)
});

interviewRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = StartDto.parse(req.body);
  const { skillsContext, first } = await interviewService.startQuestions(
    { userId: req.user!.sub, category: data.category, level: data.level, jobTitle: data.jobTitle },
    data.totalQuestions
  );
  const session = await InterviewModel.create({
    userId: req.user!.sub,
    category: data.category, level: data.level, jobTitle: data.jobTitle,
    totalQuestions: data.totalQuestions,
    skillsContext,
    turns: [{ question: first.question, kind: first.kind }]
  });
  return created(res, session);
}));

interviewRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const list = await InterviewModel.find({ userId: req.user!.sub })
    .sort({ createdAt: -1 }).limit(20).select('-turns').lean();
  return ok(res, list);
}));

interviewRouter.get('/:id', authRequired, asyncHandler(async (req, res) => {
  const s = await InterviewModel.findOne({ _id: req.params.id, userId: req.user!.sub }).lean();
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Session');
  return ok(res, s);
}));

const AnswerDto = z.object({
  answer: z.string().min(1).max(8000)
});

interviewRouter.post('/:id/answer', authRequired, asyncHandler(async (req, res) => {
  const { answer } = AnswerDto.parse(req.body);
  const session = await InterviewModel.findOne({ _id: req.params.id, userId: req.user!.sub, status: 'active' });
  if (!session) throw new HttpError(404, 'NOT_FOUND', 'Active session');

  const lastTurn = session.turns[session.turns.length - 1];
  if (!lastTurn) throw new HttpError(400, 'NO_QUESTION', 'No active question');
  if (lastTurn.answer) throw new HttpError(409, 'ALREADY_ANSWERED', 'Last question already answered');

  // Score the answer
  const feedback = await interviewService.scoreAnswer({
    category: session.category as any, level: session.level as any, jobTitle: session.jobTitle,
    question: lastTurn.question, answer
  });
  lastTurn.answer = answer;
  lastTurn.feedback = feedback as any;
  lastTurn.answeredAt = new Date();

  // Decide: next question, or finalize
  const isLast = session.turns.length >= session.totalQuestions;
  let nextQuestion: { question: string; kind: string } | null = null;

  if (!isLast) {
    const next = await interviewService.nextQuestion({
      category: session.category as any, level: session.level as any, jobTitle: session.jobTitle,
      skills: session.skillsContext as string[],
      previous: session.turns.map((t) => ({ question: t.question, answer: t.answer ?? undefined }))
    });
    session.turns.push({ question: next.question, kind: next.kind } as any);
    nextQuestion = next;
  } else {
    const report = await interviewService.finalize({
      category: session.category as any, level: session.level as any, jobTitle: session.jobTitle,
      turns: session.turns.map((t) => ({
        question: t.question, answer: t.answer ?? undefined, feedback: t.feedback as any
      }))
    });
    session.report = report as any;
    session.status = 'completed';
    session.completedAt = new Date();
    void recordInterview(req.user!.sub, report.score);
  }

  await session.save();
  return ok(res, { feedback, nextQuestion, finished: isLast, session });
}));

interviewRouter.post('/:id/skip', authRequired, asyncHandler(async (req, res) => {
  const session = await InterviewModel.findOne({ _id: req.params.id, userId: req.user!.sub, status: 'active' });
  if (!session) throw new HttpError(404, 'NOT_FOUND', 'Active session');
  const last = session.turns[session.turns.length - 1];
  if (last && !last.answer) {
    last.answer = '';
    last.answeredAt = new Date();
  }
  if (session.turns.length >= session.totalQuestions) {
    session.status = 'completed';
    session.completedAt = new Date();
  } else {
    const next = await interviewService.nextQuestion({
      category: session.category as any, level: session.level as any, jobTitle: session.jobTitle,
      skills: session.skillsContext as string[],
      previous: session.turns.map((t) => ({ question: t.question, answer: t.answer ?? undefined }))
    });
    session.turns.push({ question: next.question, kind: next.kind } as any);
  }
  await session.save();
  return ok(res, session);
}));

interviewRouter.post('/:id/abandon', authRequired, asyncHandler(async (req, res) => {
  const session = await InterviewModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub, status: 'active' },
    { $set: { status: 'abandoned' } }, { new: true }
  );
  return ok(res, session);
}));
