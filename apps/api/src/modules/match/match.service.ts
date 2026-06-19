import type { Job } from '../jobs/jobs.model';
import { JobModel, EXPERIENCE_LEVELS } from '../jobs/jobs.model';
import { CompanyModel } from '../jobs/company.model';
import { UserModel } from '../auth/auth.model';
import { ProfileModel } from '../users/profile.model';
import { ApplicationModel } from '../jobs/jobs.model';
import { FollowModel } from '../posts/interactions.model';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { logger } from '../../config/logger';
import { vectorRerank } from './vector';

export interface MatchBreakdown {
  skills: number;       // 0-100 weighted Jaccard
  experience: number;   // 0-100 level alignment
  location: number;     // 0-100 remote/region match
  recency: number;      // 0-100 fresh job preferred
  interests: number;    // 0-100 from communities, follows, applied history
}

export interface MatchResult {
  jobId: string;
  match: number;          // 0-100 weighted
  breakdown: MatchBreakdown;
  reasons: string[];
  missingSkills: string[];
  matchedSkills: string[];
  aiExplanation?: string;
}

const WEIGHTS = { skills: 0.45, experience: 0.18, location: 0.12, recency: 0.10, interests: 0.15 };

const LEVEL_ORDER: Record<string, number> = Object.fromEntries(
  EXPERIENCE_LEVELS.map((l, i) => [l, i])
);

const norm = (s: string) => s.trim().toLowerCase();

interface ScoreContext {
  skills: Set<string>;
  desiredLevel?: string;
  prefersRemote: boolean;
  location?: string;
  interestSkills: Set<string>; // weak signal — from past applications + communities
}

export const matchService = {
  async buildContextForUser(userId: string): Promise<ScoreContext> {
    const [user, profile, apps] = await Promise.all([
      UserModel.findById(userId).select('skills location').lean(),
      ProfileModel.findOne({ userId }).select('experience openToWork').lean(),
      ApplicationModel.find({ userId }).limit(40).populate('jobId').lean()
    ]);

    const profileSkills: string[] = (user?.skills as string[]) ?? [];
    const interest = new Set<string>();
    for (const a of apps) {
      const j = (a as any).jobId as { skills?: string[] } | null;
      j?.skills?.forEach((s) => interest.add(norm(s)));
    }

    // Infer desired level from latest non-current experience role (or default mid)
    const desired = guessLevel(profile);

    return {
      skills: new Set(profileSkills.map(norm)),
      desiredLevel: desired,
      prefersRemote: false, // could read from settings later
      location: user?.location ?? undefined,
      interestSkills: interest
    };
  },

  score(ctx: ScoreContext, job: Job): MatchResult {
    const jobSkills = (job.skills ?? []).map(norm);
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    for (const s of jobSkills) {
      if (ctx.skills.has(s)) matchedSkills.push(s);
      else missingSkills.push(s);
    }

    // Skills: weighted Jaccard with a length-aware floor.
    const overlap = matchedSkills.length;
    const denom = Math.max(jobSkills.length, 1);
    const skills = Math.round(
      ((overlap / denom) * 0.7 + Math.min(overlap, 6) / 6 * 0.3) * 100
    );

    // Experience: distance between user level and job level (closer = better).
    const userLvl = LEVEL_ORDER[ctx.desiredLevel ?? 'mid'] ?? 2;
    const jobLvl = LEVEL_ORDER[job.experienceLevel] ?? 2;
    const distance = Math.abs(userLvl - jobLvl);
    const experience = Math.max(0, 100 - distance * 18);

    // Location: remote = 100; otherwise crude city contains.
    const location = job.remote
      ? 100
      : ctx.location && job.location?.toLowerCase().includes(ctx.location.toLowerCase()) ? 90
      : ctx.location && job.location ? 55 : 70;

    // Recency: posted within last 14 days = 100, falls off over 90 days.
    const ageDays = (Date.now() - new Date(job.createdAt as any).getTime()) / 86_400_000;
    const recency = Math.max(0, Math.round(100 - Math.max(0, ageDays - 14) * (100 / 76)));

    // Interests: overlap with skills user has shown interest in via applications.
    const interestOverlap = jobSkills.filter((s: string) => ctx.interestSkills.has(s)).length;
    const interests = Math.min(100, interestOverlap * 25);

    const breakdown: MatchBreakdown = { skills, experience, location, recency, interests };
    const match = Math.round(
      breakdown.skills * WEIGHTS.skills +
      breakdown.experience * WEIGHTS.experience +
      breakdown.location * WEIGHTS.location +
      breakdown.recency * WEIGHTS.recency +
      breakdown.interests * WEIGHTS.interests
    );

    const reasons: string[] = [];
    if (skills >= 70) reasons.push(`Strong skill overlap (${overlap}/${denom})`);
    if (experience >= 80) reasons.push(`Right experience level (${job.experienceLevel})`);
    if (location === 100) reasons.push('Remote role');
    if (recency >= 90) reasons.push('Posted recently');
    if (interestOverlap > 0) reasons.push('Aligns with roles you’ve applied to before');

    return { jobId: String(job._id ?? (job as any).id), match, breakdown, reasons, missingSkills, matchedSkills };
  },

  async explainTopWithAI(userId: string, results: MatchResult[]): Promise<MatchResult[]> {
    if (!isAIEnabled() || results.length === 0) return results;
    const client = openai()!;
    const user = await UserModel.findById(userId).select('name role headline skills').lean();
    const compact = results.slice(0, 5).map((r) => ({
      jobId: r.jobId, match: r.match,
      matched: r.matchedSkills.slice(0, 8), missing: r.missingSkills.slice(0, 8),
      breakdown: r.breakdown
    }));
    try {
      const resp = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [
          { role: 'system', content:
            `You explain why a job is a good match. Return JSON { "explanations": { "<jobId>": string } }.
            Keep each under 30 words, second person, specific. Focus on what aligns AND one quick win.` },
          { role: 'user', content:
            `User: ${user?.name} · ${user?.role} · ${user?.headline ?? ''}\nSkills: ${(user?.skills as string[] | undefined)?.join(', ') ?? '—'}\n\nMatches:\n${JSON.stringify(compact, null, 2)}` }
        ]
      });
      const out = JSON.parse(resp.choices[0]?.message?.content ?? '{}');
      const map: Record<string, string> = out.explanations ?? {};
      return results.map((r) => ({ ...r, aiExplanation: map[r.jobId] }));
    } catch (e) {
      logger.error(e, 'match explain failed');
      return results;
    }
  },

  async topForUser(userId: string, limit = 12) {
    const ctx = await this.buildContextForUser(userId);

    // Candidate pool: open jobs, prefer matching skills, fall back to recent.
    const filter: Record<string, unknown> = { status: 'open' };
    if (ctx.skills.size > 0) {
      filter.skills = { $in: [...ctx.skills] };
    }
    const pool = await JobModel.find(filter).sort({ createdAt: -1 }).limit(120).lean();

    let scored = pool.map((j) => this.score(ctx, j as any));

    // Blend in vector similarity (cosine) when AI is enabled. Up to +12 pts.
    if (process.env.USE_VECTOR_SEARCH !== 'false') {
      const sims = await vectorRerank(userId, scored.slice(0, 50).map((r) => r.jobId));
      if (sims.size > 0) {
        scored = scored.map((r) => {
          const s = sims.get(r.jobId);
          if (s === undefined) return r;
          const bump = Math.round(s * 12); // cosine 0..1 -> 0..12
          return { ...r, match: Math.min(100, r.match + bump) };
        });
      }
    }

    scored = scored.sort((a, b) => b.match - a.match).slice(0, limit);

    const ranked = await this.explainTopWithAI(userId, scored);

    // Hydrate companies
    const jobs = await JobModel.find({ _id: { $in: ranked.map((r) => r.jobId) } }).lean();
    const byJob = new Map(jobs.map((j) => [String(j._id), j]));
    const companies = await CompanyModel.find({ _id: { $in: jobs.map((j) => j.companyId) } })
      .select('name slug logo verified').lean();
    const byCompany = new Map(companies.map((c) => [String(c._id), c]));

    return ranked
      .map((r) => {
        const j = byJob.get(r.jobId);
        if (!j) return null;
        return {
          ...r,
          job: { ...j, company: byCompany.get(String(j.companyId)) }
        };
      })
      .filter(Boolean);
  },

  async scoreSingle(userId: string, jobId: string) {
    const ctx = await this.buildContextForUser(userId);
    const job = await JobModel.findById(jobId).lean();
    if (!job) return null;
    return this.score(ctx, job as any);
  }
};

function guessLevel(profile: any): string {
  if (!profile?.experience?.length) return 'mid';
  const totalMonths = profile.experience.reduce((m: number, e: any) => {
    const start = e.start ? new Date(e.start).getTime() : 0;
    const end = e.current ? Date.now() : (e.end ? new Date(e.end).getTime() : 0);
    if (!start || !end) return m;
    return m + Math.max(0, (end - start) / (30 * 86_400_000));
  }, 0);
  if (totalMonths < 12) return 'entry';
  if (totalMonths < 36) return 'mid';
  if (totalMonths < 84) return 'senior';
  return 'staff';
}
