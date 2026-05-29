import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { CompanyReviewModel, EMPLOYMENT_STATUSES } from './company.reviews.model';
import { CompanyModel } from './company.model';
import { UserModel } from '../auth/auth.model';

export const companyReviewsRouter = Router({ mergeParams: true });

async function loadCompany(slugOrId: string) {
  const filter = mongoose.Types.ObjectId.isValid(slugOrId)
    ? { _id: new mongoose.Types.ObjectId(slugOrId) }
    : { slug: slugOrId };
  return CompanyModel.findOne(filter).select('_id slug name').lean();
}

const CreateDto = z.object({
  rating: z.number().int().min(1).max(5),
  breakdown: z.object({
    culture: z.number().int().min(1).max(5),
    comp: z.number().int().min(1).max(5),
    worklife: z.number().int().min(1).max(5),
    management: z.number().int().min(1).max(5),
    growth: z.number().int().min(1).max(5)
  }),
  title: z.string().min(4).max(140),
  pros: z.string().max(4000).optional(),
  cons: z.string().max(4000).optional(),
  advice: z.string().max(2000).optional(),
  recommend: z.boolean().default(true),
  role: z.string().max(120).optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES),
  tenureYears: z.number().min(0).max(60).optional(),
  location: z.string().max(120).optional(),
  anonymous: z.boolean().default(false)
});

/* ─── List ─── */
companyReviewsRouter.get('/', asyncHandler(async (req, res) => {
  const c = await loadCompany(req.params.slug);
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');

  const filter: Record<string, unknown> = { companyId: c._id, status: 'active' };
  if (req.query.minRating) filter.rating = { $gte: Number(req.query.minRating) };
  if (req.query.status) filter.employmentStatus = String(req.query.status);

  const sort =
    req.query.sort === 'top' ? { helpfulBy: -1 as const, createdAt: -1 as const } :
    req.query.sort === 'low' ? { rating: 1 as const } :
    req.query.sort === 'high' ? { rating: -1 as const } :
    { createdAt: -1 as const };

  const limit = Math.min(40, Number(req.query.limit ?? 20));
  const rows = await CompanyReviewModel.find(filter).sort(sort as any).limit(limit).lean();

  // Hydrate authors only for non-anonymous reviews
  const visibleAuthorIds = rows.filter((r) => !r.anonymous).map((r) => r.authorId);
  const authors = await UserModel.find({ _id: { $in: visibleAuthorIds } })
    .select('handle name avatar headline').lean();
  const byId = new Map(authors.map((u) => [String(u._id), u]));

  return ok(res, rows.map((r) => ({
    ...r,
    helpfulCount: r.helpfulBy?.length ?? 0,
    helpfulBy: undefined, // hide raw list
    author: r.anonymous ? null : byId.get(String(r.authorId))
  })));
}));

/* ─── Analytics ─── */
companyReviewsRouter.get('/analytics', asyncHandler(async (req, res) => {
  const c = await loadCompany(req.params.slug);
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');

  const [agg] = await CompanyReviewModel.aggregate([
    { $match: { companyId: c._id, status: 'active' } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avg: { $avg: '$rating' },
        culture: { $avg: '$breakdown.culture' },
        comp: { $avg: '$breakdown.comp' },
        worklife: { $avg: '$breakdown.worklife' },
        management: { $avg: '$breakdown.management' },
        growth: { $avg: '$breakdown.growth' },
        recommend: {
          $avg: { $cond: [{ $eq: ['$recommend', true] }, 1, 0] }
        }
      }
    }
  ]);

  const distribution = await CompanyReviewModel.aggregate<{ _id: number; count: number }>([
    { $match: { companyId: c._id, status: 'active' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } }
  ]);
  const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distribution) distMap[d._id] = d.count;

  return ok(res, {
    count: agg?.count ?? 0,
    avg: round1(agg?.avg ?? 0),
    breakdown: {
      culture: round1(agg?.culture ?? 0),
      comp: round1(agg?.comp ?? 0),
      worklife: round1(agg?.worklife ?? 0),
      management: round1(agg?.management ?? 0),
      growth: round1(agg?.growth ?? 0)
    },
    recommendPct: Math.round((agg?.recommend ?? 0) * 100),
    distribution: distMap
  });
}));

function round1(n: number) { return Math.round(n * 10) / 10; }

/* ─── My review for this company ─── */
companyReviewsRouter.get('/me', authRequired, asyncHandler(async (req, res) => {
  const c = await loadCompany(req.params.slug);
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');
  const r = await CompanyReviewModel.findOne({ companyId: c._id, authorId: req.user!.sub }).lean();
  return ok(res, r);
}));

/* ─── Create / update (one per user per company) ─── */
companyReviewsRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const c = await loadCompany(req.params.slug);
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Company');
  const data = CreateDto.parse(req.body);
  const r = await CompanyReviewModel.findOneAndUpdate(
    { companyId: c._id, authorId: req.user!.sub },
    { $set: { ...data, status: 'active', flagged: false } },
    { new: true, upsert: true }
  );
  return created(res, r);
}));

companyReviewsRouter.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  await CompanyReviewModel.deleteOne({ _id: req.params.id, authorId: req.user!.sub });
  return ok(res, { ok: true });
}));

/* ─── Helpful + flag ─── */
companyReviewsRouter.post('/:id/helpful', authRequired, asyncHandler(async (req, res) => {
  const r = await CompanyReviewModel.findById(req.params.id);
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Review');
  const uid = req.user!.sub;
  const has = r.helpfulBy?.some((x: any) => String(x) === uid);
  if (has) (r.helpfulBy as any) = (r.helpfulBy as any).filter((x: any) => String(x) !== uid);
  else (r.helpfulBy as any).push(uid);
  await r.save();
  return ok(res, { helpfulCount: r.helpfulBy?.length ?? 0, helpful: !has });
}));

companyReviewsRouter.post('/:id/flag', authRequired, asyncHandler(async (req, res) => {
  await CompanyReviewModel.updateOne({ _id: req.params.id }, { $set: { flagged: true } });
  return ok(res, { ok: true });
}));
