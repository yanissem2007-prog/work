import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { parsePdf } from './pdf';
import { computeHeuristics } from './heuristics';
import { analyzeCv } from './analyzer.service';
import { CvReportModel } from './report.model';
import { awardXp } from '../gamification/xp.service';
import { JobModel } from '../jobs/jobs.model';
import { CompanyModel } from '../jobs/company.model';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB
});

const tight = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true });

export const analyzerRouter = Router();

/**
 * POST /cv-analyzer/analyze — multipart form (file=<pdf>)
 * Optional: text=<string>   raw text (no upload)
 */
analyzerRouter.post('/analyze', authRequired, tight,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    let text: string;
    let pages: number | undefined;
    let wordCount: number | undefined;
    let fileName: string | undefined;

    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        throw new HttpError(415, 'BAD_TYPE', 'Only PDF accepted');
      }
      const parsed = await parsePdf(req.file.buffer);
      text = parsed.text; pages = parsed.pages; wordCount = parsed.wordCount;
      fileName = req.file.originalname;
    } else if (typeof req.body?.text === 'string' && req.body.text.length >= 80) {
      text = req.body.text;
    } else {
      throw new HttpError(400, 'NO_INPUT', 'Provide a PDF file or raw text');
    }

    const heuristics = computeHeuristics(text);
    const report = await analyzeCv(text, heuristics);

    // Recommend live jobs based on detected/missing skills
    const skillsForMatch = [...new Set([...report.detectedSkills, ...report.recommendations.missingSkills])];
    const jobs = skillsForMatch.length
      ? await JobModel.find({ status: 'open', skills: { $in: skillsForMatch } })
          .sort({ createdAt: -1 }).limit(6).lean()
      : [];
    const companies = await CompanyModel.find({ _id: { $in: jobs.map((j) => j.companyId) } })
      .select('name slug logo').lean();
    const byId = new Map(companies.map((c) => [String(c._id), c]));

    void awardXp(req.user!.sub, 'cv.analyze');

    const saved = await CvReportModel.create({
      userId: req.user!.sub,
      fileName, pages, wordCount,
      score: report.score, report
    });

    return created(res, {
      id: String(saved._id),
      pages, wordCount, fileName,
      report,
      heuristics,
      recommendedJobs: jobs.map((j) => ({
        id: String(j._id), title: j.title,
        type: j.type, experienceLevel: j.experienceLevel,
        location: j.location, remote: j.remote,
        salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency,
        skills: j.skills,
        company: byId.get(String(j.companyId)),
        href: `/jobs/${j._id}`
      }))
    });
  })
);

analyzerRouter.get('/reports', authRequired, asyncHandler(async (req, res) => {
  const list = await CvReportModel.find({ userId: req.user!.sub })
    .sort({ createdAt: -1 }).select('-report').limit(20).lean();
  return ok(res, list);
}));

analyzerRouter.get('/reports/:id', authRequired, asyncHandler(async (req, res) => {
  const r = await CvReportModel.findOne({ _id: req.params.id, userId: req.user!.sub }).lean();
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Report');
  return ok(res, r);
}));
