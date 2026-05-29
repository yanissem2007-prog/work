import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { ProjectIdeaModel, PROJECT_KINDS, PROJECT_STATUSES, type ProjectKind } from './projects.model';
import { generateIdeas, toneOf } from './projects.service';
import { fetchRepoMetadata } from './github.service';

const tight = rateLimit({ windowMs: 60_000, max: 10 });
export const projectsRouter = Router();

const SuggestDto = z.object({
  goal: z.string().max(280).optional(),
  kinds: z.array(z.enum(PROJECT_KINDS)).optional(),
  count: z.number().int().min(3).max(8).optional()
});

projectsRouter.post('/suggest', authRequired, tight, asyncHandler(async (req, res) => {
  const data = SuggestDto.parse(req.body ?? {});
  const ideas = await generateIdeas({ userId: req.user!.sub, ...data });
  const saved = await ProjectIdeaModel.insertMany(
    ideas.map((i) => ({ ...i, userId: req.user!.sub, status: 'suggested', color: toneOf(i.kind) }))
  );
  return created(res, saved);
}));

projectsRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { userId: req.user!.sub };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.kind) filter.kind = String(req.query.kind);
  const list = await ProjectIdeaModel.find(filter).sort({ updatedAt: -1 }).limit(60).lean();
  return ok(res, list);
}));

const PatchDto = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  repoUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional()
});

projectsRouter.patch('/:id', authRequired, asyncHandler(async (req, res) => {
  const data = PatchDto.parse(req.body);
  const idea = await ProjectIdeaModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub },
    { $set: data },
    { new: true }
  );
  if (!idea) throw new HttpError(404, 'NOT_FOUND', 'Idea');
  return ok(res, idea);
}));

projectsRouter.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  await ProjectIdeaModel.deleteOne({ _id: req.params.id, userId: req.user!.sub });
  return ok(res, { ok: true });
}));

/* ─── GitHub import ─── */

const GhPreviewDto = z.object({ repo: z.string().min(3).max(200) });

/** Public preview — pulls metadata without saving. */
projectsRouter.post('/github/preview', authRequired, tight, asyncHandler(async (req, res) => {
  const { repo } = GhPreviewDto.parse(req.body);
  const meta = await fetchRepoMetadata(repo);
  return ok(res, meta);
}));

/**
 * Attach a GitHub repo to a project idea and auto-enrich:
 * fills repoUrl + demoUrl (homepage) + appends GitHub language/topics into stack/skills.
 */
projectsRouter.post('/:id/github', authRequired, tight, asyncHandler(async (req, res) => {
  const { repo } = GhPreviewDto.parse(req.body);
  const idea = await ProjectIdeaModel.findOne({ _id: req.params.id, userId: req.user!.sub });
  if (!idea) throw new HttpError(404, 'NOT_FOUND', 'Idea');

  const meta = await fetchRepoMetadata(repo);
  idea.repoUrl = meta.htmlUrl;
  if (meta.homepage) idea.demoUrl = meta.homepage;
  if (meta.language && !idea.stack.includes(meta.language)) idea.stack.push(meta.language);
  for (const t of meta.topics.slice(0, 6)) {
    if (!idea.skills.includes(t)) idea.skills.push(t);
  }
  if (idea.status === 'suggested' || idea.status === 'saved') idea.status = 'in_progress';
  await idea.save();
  return ok(res, { idea, meta });
}));

