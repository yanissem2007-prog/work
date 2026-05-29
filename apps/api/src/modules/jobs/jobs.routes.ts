import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  JobModel, ApplicationModel, SavedJobModel,
  JOB_TYPES, EXPERIENCE_LEVELS, APPLICATION_STATUSES
} from './jobs.model';
import { CompanyModel, CompanyFollowModel } from './company.model';
import { authRequired } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { UserModel } from '../auth/auth.model';
import { getIO } from '../../sockets/registry';
import { awardXp } from '../gamification/xp.service';
import { notify } from '../notifications/notify.service';

const { Types: { ObjectId } } = mongoose;
export const jobRouter = Router();

/* ─── Filters helper ─── */
function buildFilter(q: Record<string, unknown>) {
  const f: Record<string, unknown> = { status: 'open' };
  if (q.q) f.$text = { $search: String(q.q) };
  if (q.type) f.type = { $in: String(q.type).split(',') };
  if (q.experience) f.experienceLevel = { $in: String(q.experience).split(',') };
  if (q.remote === 'true') f.remote = true;
  if (q.region) f.region = { $in: String(q.region).split(',') };
  if (q.skills) f.skills = { $in: String(q.skills).split(',') };
  if (q.company) f.companyId = new ObjectId(String(q.company));
  if (q.salaryMin) f.salaryMin = { $gte: Number(q.salaryMin) };
  return f;
}

/* ─── List (with cursor + filters) ─── */
jobRouter.get('/', asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  if (req.query.cursor) (filter as any).createdAt = { $lt: new Date(String(req.query.cursor)) };
  const limit = Math.min(40, Number(req.query.limit ?? 20));
  const sort = req.query.sort === 'salary' ? { salaryMin: -1 } : { createdAt: -1 };
  const jobs = await JobModel.find(filter).sort(sort as any).limit(limit + 1).lean();
  const hasMore = jobs.length > limit;
  const items = hasMore ? jobs.slice(0, limit) : jobs;

  const companies = await CompanyModel.find({ _id: { $in: items.map((j) => j.companyId) } })
    .select('name slug logo verified location').lean();
  const byId = new Map(companies.map((c) => [String(c._id), c]));
  const enriched = items.map((j) => ({ ...j, company: byId.get(String(j.companyId)) }));
  return ok(res, enriched, { cursor: hasMore ? items[items.length - 1].createdAt?.toISOString() : undefined });
}));

/* ─── Facets (counts for filter UI) ─── */
jobRouter.get('/facets', asyncHandler(async (req, res) => {
  const filter = buildFilter({ ...req.query, type: undefined, experience: undefined });
  const [byType, byLevel, byRegion, totalRemote, total] = await Promise.all([
    JobModel.aggregate([{ $match: filter }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    JobModel.aggregate([{ $match: filter }, { $group: { _id: '$experienceLevel', count: { $sum: 1 } } }]),
    JobModel.aggregate([{ $match: filter }, { $group: { _id: '$region', count: { $sum: 1 } } }]),
    JobModel.countDocuments({ ...filter, remote: true }),
    JobModel.countDocuments(filter)
  ]);
  return ok(res, { total, remote: totalRemote, byType, byLevel, byRegion });
}));

/* ─── Saved + applied (must be before /:id) ─── */
jobRouter.get('/saved', authRequired, asyncHandler(async (req, res) => {
  const saves = await SavedJobModel.find({ userId: req.user!.sub }).sort({ createdAt: -1 }).lean();
  const jobs = await JobModel.find({ _id: { $in: saves.map((s) => s.jobId) } }).lean();
  return ok(res, jobs);
}));

jobRouter.get('/applications', authRequired, asyncHandler(async (req, res) => {
  const apps = await ApplicationModel.find({ userId: req.user!.sub }).sort({ createdAt: -1 }).lean();
  const jobs = await JobModel.find({ _id: { $in: apps.map((a) => a.jobId) } }).lean();
  const byJob = new Map(jobs.map((j) => [String(j._id), j]));
  return ok(res, apps.map((a) => ({ ...a, job: byJob.get(String(a.jobId)) })));
}));

jobRouter.get('/recommended', authRequired, asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user!.sub).select('skills').lean();
  const skills = user?.skills ?? [];
  const filter: Record<string, unknown> = { status: 'open' };
  if (skills.length) filter.skills = { $in: skills };
  const jobs = await JobModel.find(filter).sort({ createdAt: -1 }).limit(12).lean();
  const companies = await CompanyModel.find({ _id: { $in: jobs.map((j) => j.companyId) } })
    .select('name slug logo verified').lean();
  const byId = new Map(companies.map((c) => [String(c._id), c]));
  return ok(res, jobs.map((j) => ({ ...j, company: byId.get(String(j.companyId)) })));
}));

/* ─── Recruiter dashboards (also before /:id) ─── */
jobRouter.get('/manage/mine', authRequired, requirePermission('job.create', 'job.manage'),
  asyncHandler(async (req, res) => {
    const jobs = await JobModel.find({ recruiterId: req.user!.sub }).sort({ createdAt: -1 }).lean();
    return ok(res, jobs);
  }));

/* ─── Detail ─── */
jobRouter.get('/:id', asyncHandler(async (req, res) => {
  const job = await JobModel.findOneAndUpdate(
    { _id: req.params.id, status: { $in: ['open', 'closed'] } },
    { $inc: { viewsCount: 1 } },
    { new: true }
  ).lean();
  if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job');
  const company = await CompanyModel.findById(job.companyId).lean();
  return ok(res, { ...job, company });
}));

/* ─── Create / edit / delete (recruiter or company) ─── */
const CreateDto = z.object({
  companyId: z.string(),
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(20000),
  type: z.enum(JOB_TYPES).default('full-time'),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default('mid'),
  remote: z.boolean().default(false),
  location: z.string().optional(),
  region: z.string().optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  currency: z.string().length(3).optional(),
  skills: z.array(z.string()).max(20).optional(),
  benefits: z.array(z.string()).max(20).optional(),
  applyUrl: z.string().url().optional(),
  expiresAt: z.string().optional()
});

jobRouter.post('/', authRequired, requirePermission('job.create'), asyncHandler(async (req, res) => {
  const data = CreateDto.parse(req.body);
  const company = await CompanyModel.findOne({ _id: data.companyId });
  if (!company) throw new HttpError(404, 'NOT_FOUND', 'Company');
  if (String(company.ownerId) !== req.user!.sub && !company.members?.map(String).includes(req.user!.sub)) {
    throw new HttpError(403, 'FORBIDDEN', 'Not a company member');
  }
  const job = await JobModel.create({ ...data, recruiterId: req.user!.sub });
  await CompanyModel.updateOne({ _id: company._id }, { $inc: { jobsCount: 1 } });
  getIO()?.emit('job:new', { id: String(job._id), companyId: String(company._id), title: job.title });
  return created(res, job);
}));

jobRouter.patch('/:id', authRequired, requirePermission('job.manage'), asyncHandler(async (req, res) => {
  const job = await JobModel.findOneAndUpdate(
    { _id: req.params.id, recruiterId: req.user!.sub },
    { $set: req.body },
    { new: true }
  );
  if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job');
  return ok(res, job);
}));

jobRouter.delete('/:id', authRequired, requirePermission('job.manage'), asyncHandler(async (req, res) => {
  const job = await JobModel.findOneAndUpdate(
    { _id: req.params.id, recruiterId: req.user!.sub },
    { $set: { status: 'closed' } }
  );
  if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job');
  return ok(res, { ok: true });
}));

/* ─── Save / unsave ─── */
jobRouter.post('/:id/save', authRequired, asyncHandler(async (req, res) => {
  const existing = await SavedJobModel.findOneAndDelete({ jobId: req.params.id, userId: req.user!.sub });
  if (existing) return ok(res, { saved: false });
  await SavedJobModel.create({ jobId: req.params.id, userId: req.user!.sub });
  return ok(res, { saved: true });
}));

/* ─── Apply ─── */
const ApplyDto = z.object({
  cvUrl: z.string().url().optional(),
  coverLetter: z.string().max(4000).optional()
});

jobRouter.post('/:id/apply', authRequired, requirePermission('job.apply'), asyncHandler(async (req, res) => {
  const job = await JobModel.findOne({ _id: req.params.id, status: 'open' });
  if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job');
  const data = ApplyDto.parse(req.body);
  const existing = await ApplicationModel.findOne({ jobId: job._id, userId: req.user!.sub });
  if (existing) throw new HttpError(409, 'CONFLICT', 'Already applied');

  const app = await ApplicationModel.create({
    jobId: job._id,
    userId: req.user!.sub,
    companyId: job.companyId,
    cvUrl: data.cvUrl,
    coverLetter: data.coverLetter,
    timeline: [{ status: 'submitted', at: new Date(), byUserId: req.user!.sub as any }]
  });
  await JobModel.updateOne({ _id: job._id }, { $inc: { applicantsCount: 1 } });
  void awardXp(req.user!.sub, 'job.apply', { jobId: String(job._id) });
  void notify({
    userId: String(job.recruiterId),
    type: 'job_application',
    actorId: req.user!.sub,
    target: { kind: 'job', id: String(job._id) },
    title: `applied to ${job.title}`,
    href: `/jobs/manage`
  });
  return created(res, app);
}));

/* ─── Recruiter — applications received ─── */
jobRouter.get('/:id/applications', authRequired, requirePermission('application.review'),
  asyncHandler(async (req, res) => {
    const job = await JobModel.findOne({ _id: req.params.id, recruiterId: req.user!.sub }).lean();
    if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job');
    const apps = await ApplicationModel.find({ jobId: job._id }).sort({ createdAt: -1 }).lean();
    const users = await UserModel.find({ _id: { $in: apps.map((a) => a.userId) } })
      .select('handle name avatar headline location skills').lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return ok(res, apps.map((a) => ({ ...a, applicant: byId.get(String(a.userId)) })));
  }));

const StatusDto = z.object({
  status: z.enum(APPLICATION_STATUSES),
  note: z.string().max(1000).optional()
});

jobRouter.patch('/applications/:id/status', authRequired, requirePermission('application.review'),
  asyncHandler(async (req, res) => {
    const app = await ApplicationModel.findById(req.params.id);
    if (!app) throw new HttpError(404, 'NOT_FOUND', 'Application');
    const job = await JobModel.findById(app.jobId).select('recruiterId').lean();
    if (String(job?.recruiterId) !== req.user!.sub) throw new HttpError(403, 'FORBIDDEN', 'Not your job');

    const { status, note } = StatusDto.parse(req.body);
    app.status = status as any;
    app.timeline.push({ status, at: new Date(), note, byUserId: req.user!.sub as any } as any);
    await app.save();
    void notify({
      userId: String(app.userId),
      type: 'application_status',
      actorId: req.user!.sub,
      target: { kind: 'job', id: String(app.jobId) },
      title: `Application moved to ${status}`,
      body: note,
      href: '/jobs/applications'
    });
    return ok(res, app);
  }));

jobRouter.post('/applications/:id/withdraw', authRequired, asyncHandler(async (req, res) => {
  const app = await ApplicationModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub },
    { $set: { status: 'withdrawn', withdrawnAt: new Date() } },
    { new: true }
  );
  if (!app) throw new HttpError(404, 'NOT_FOUND', 'Application');
  return ok(res, app);
}));
