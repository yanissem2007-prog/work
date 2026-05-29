import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { CvModel, TEMPLATES, SECTION_TYPES } from './cv.model';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { awardXp } from '../gamification/xp.service';

export const cvRouter = Router();

const SectionDto = z.object({
  id: z.string(),
  type: z.enum(SECTION_TYPES),
  title: z.string().optional(),
  visible: z.boolean().optional(),
  items: z.array(z.record(z.unknown())).optional(),
  content: z.string().optional()
});

const CreateDto = z.object({
  title: z.string().min(1).max(120).optional(),
  template: z.enum(TEMPLATES).optional(),
  accent: z.string().optional()
});

const UpdateDto = z.object({
  title: z.string().min(1).max(120).optional(),
  template: z.enum(TEMPLATES).optional(),
  accent: z.string().optional(),
  sections: z.array(SectionDto).optional()
});

function defaultSections(name?: string) {
  return [
    { id: crypto.randomUUID(), type: 'personal', title: 'Personal', visible: true,
      items: [{ name: name ?? '', headline: '', email: '', phone: '', location: '', website: '' }] },
    { id: crypto.randomUUID(), type: 'summary', title: 'Summary', visible: true,
      content: 'Write a punchy two-sentence summary…' },
    { id: crypto.randomUUID(), type: 'experience', title: 'Experience', visible: true,
      items: [{ company: '', role: '', start: '', end: '', current: false, location: '', description: '' }] },
    { id: crypto.randomUUID(), type: 'education', title: 'Education', visible: true,
      items: [{ school: '', degree: '', field: '', start: '', end: '' }] },
    { id: crypto.randomUUID(), type: 'skills', title: 'Skills', visible: true, items: [] },
    { id: crypto.randomUUID(), type: 'projects', title: 'Projects', visible: true, items: [] },
    { id: crypto.randomUUID(), type: 'links', title: 'Links', visible: true, items: [] }
  ];
}

cvRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const list = await CvModel.find({ userId: req.user!.sub }).sort({ lastEditedAt: -1 }).lean();
  return ok(res, list);
}));

cvRouter.get('/:id', authRequired, asyncHandler(async (req, res) => {
  const cv = await CvModel.findOne({ _id: req.params.id, userId: req.user!.sub }).lean();
  if (!cv) throw new HttpError(404, 'NOT_FOUND', 'CV');
  return ok(res, cv);
}));

cvRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = CreateDto.parse(req.body ?? {});
  const cv = await CvModel.create({
    userId: req.user!.sub,
    title: data.title ?? 'Untitled CV',
    template: data.template ?? 'minimal',
    accent: data.accent,
    sections: defaultSections()
  });
  void awardXp(req.user!.sub, 'cv.create');
  return created(res, cv);
}));

cvRouter.patch('/:id', authRequired, asyncHandler(async (req, res) => {
  const data = UpdateDto.parse(req.body);
  const cv = await CvModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub },
    { $set: { ...data, lastEditedAt: new Date() } },
    { new: true }
  ).lean();
  if (!cv) throw new HttpError(404, 'NOT_FOUND', 'CV');
  return ok(res, cv);
}));

cvRouter.post('/:id/duplicate', authRequired, asyncHandler(async (req, res) => {
  const original = await CvModel.findOne({ _id: req.params.id, userId: req.user!.sub }).lean();
  if (!original) throw new HttpError(404, 'NOT_FOUND', 'CV');
  const dup = await CvModel.create({
    userId: req.user!.sub,
    title: `${original.title} — Copy`,
    template: original.template,
    accent: original.accent,
    sections: (original.sections ?? []).map((s: any) => ({ ...s, id: crypto.randomUUID() }))
  });
  return created(res, dup);
}));

cvRouter.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  await CvModel.deleteOne({ _id: req.params.id, userId: req.user!.sub });
  return ok(res, { ok: true });
}));

cvRouter.post('/:id/publish', authRequired, asyncHandler(async (req, res) => {
  const slug = crypto.randomBytes(6).toString('hex');
  const cv = await CvModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub },
    { $set: { publicSlug: slug } },
    { new: true }
  ).lean();
  if (!cv) throw new HttpError(404, 'NOT_FOUND', 'CV');
  return ok(res, { publicSlug: slug });
}));

cvRouter.get('/public/:slug', asyncHandler(async (req, res) => {
  const cv = await CvModel.findOne({ publicSlug: req.params.slug }).lean();
  if (!cv) throw new HttpError(404, 'NOT_FOUND', 'CV');
  return ok(res, cv);
}));

const AiDto = z.object({
  kind: z.enum(['summary', 'experience-bullet', 'skills-suggest', 'rewrite']),
  context: z.record(z.unknown()).optional()
});

cvRouter.post('/ai/suggest', authRequired, asyncHandler(async (req, res) => {
  const { kind, context } = AiDto.parse(req.body);
  const result = ((): string => {
    switch (kind) {
      case 'summary': {
        const name = (context?.name as string) || 'Professional';
        const role = (context?.headline as string) || 'engineer';
        return `${name} — a ${role} who turns ambiguous problems into shipped products. ` +
          `Five years building consumer-grade experiences with measurable revenue and retention impact.`;
      }
      case 'experience-bullet': {
        const role = (context?.role as string) || 'engineer';
        return [
          `Led a 4-person ${role} team that shipped the redesigned checkout (+38% conversion, +$2.4M ARR).`,
          `Cut p95 latency 62% by re-architecting the data layer; saved 8 engineering days per quarter.`,
          `Mentored 6 juniors; 4 promoted within 18 months.`
        ].join('\n');
      }
      case 'skills-suggest':
        return ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'AWS', 'Design Systems'].join(', ');
      case 'rewrite':
        return ((context?.text as string) ?? '').trim().replace(/^\w/, (c) => c.toUpperCase()) +
          ' — rewritten with stronger verbs and measurable outcomes.';
    }
  })();
  return ok(res, { suggestion: result });
}));
