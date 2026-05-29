import { Router } from 'express';
import { z } from 'zod';
import { CompanyModel, CompanyFollowModel, COMPANY_SIZES } from './company.model';
import { JobModel } from './jobs.model';
import { authRequired } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { companyReviewsRouter } from './company.reviews.routes';

export const companyRouter = Router();

companyRouter.use('/:slug/reviews', companyReviewsRouter);

const CreateDto = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(COMPANY_SIZES).optional(),
  location: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  tags: z.array(z.string()).max(15).optional()
});

companyRouter.get('/', asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const filter: Record<string, unknown> = {};
  if (q) filter.$text = { $search: q };
  const items = await CompanyModel.find(filter).sort({ followersCount: -1, jobsCount: -1 }).limit(40).lean();
  return ok(res, items);
}));

companyRouter.get('/mine', authRequired, requirePermission('company.manage', 'job.create'),
  asyncHandler(async (req, res) => {
    const items = await CompanyModel.find({
      $or: [{ ownerId: req.user!.sub }, { members: req.user!.sub }]
    }).lean();
    return ok(res, items);
  }));

companyRouter.get('/:slug', asyncHandler(async (req, res) => {
  const c = await CompanyModel.findOne({ slug: req.params.slug }).lean();
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');
  const jobs = await JobModel.find({ companyId: c._id, status: 'open' })
    .sort({ createdAt: -1 }).limit(20).lean();
  return ok(res, { ...c, jobs });
}));

companyRouter.post('/', authRequired, requirePermission('job.create', 'company.manage'),
  asyncHandler(async (req, res) => {
    const data = CreateDto.parse(req.body);
    const exists = await CompanyModel.exists({ slug: data.slug });
    if (exists) throw new HttpError(409, 'CONFLICT', 'Slug taken');
    const c = await CompanyModel.create({ ...data, ownerId: req.user!.sub });
    return created(res, c);
  }));

companyRouter.patch('/:slug', authRequired, requirePermission('company.manage'),
  asyncHandler(async (req, res) => {
    const c = await CompanyModel.findOneAndUpdate(
      { slug: req.params.slug, ownerId: req.user!.sub },
      { $set: req.body },
      { new: true }
    );
    if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');
    return ok(res, c);
  }));

companyRouter.post('/:slug/follow', authRequired, asyncHandler(async (req, res) => {
  const c = await CompanyModel.findOne({ slug: req.params.slug }).select('_id').lean();
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');
  const existing = await CompanyFollowModel.findOneAndDelete({ companyId: c._id, userId: req.user!.sub });
  if (existing) {
    await CompanyModel.updateOne({ _id: c._id }, { $inc: { followersCount: -1 } });
    return ok(res, { following: false });
  }
  await CompanyFollowModel.create({ companyId: c._id, userId: req.user!.sub });
  await CompanyModel.updateOne({ _id: c._id }, { $inc: { followersCount: 1 } });
  return ok(res, { following: true });
}));
