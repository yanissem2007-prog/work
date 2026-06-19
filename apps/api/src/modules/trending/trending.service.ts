import mongoose from 'mongoose';
import { PostModel } from '../posts/posts.model';
import { ReactionModel } from '../posts/interactions.model';
import { JobModel, ApplicationModel } from '../jobs/jobs.model';
import { CompanyModel } from '../jobs/company.model';
import { CommunityModel, MembershipModel } from '../communities/communities.model';
import { UserModel } from '../auth/auth.model';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

const CACHE_KEY = 'trending:overview';
const CACHE_TTL_SECONDS = 60;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface TrendingPost {
  id: string; content: string; createdAt: string;
  score: number;
  likes: number; comments: number; reposts: number;
  author?: { handle?: string; name?: string; avatar?: string | null } | Record<string, any>;
}
export interface TrendingJob {
  id: string; title: string;
  applicantsCount: number; viewsCount: number;
  createdAt: string;
  applicantsLastDay: number;
  company?: { name?: string; slug?: string; logo?: string | null } | Record<string, any>;
}
export interface TrendingSkill   { skill: string; jobMentions: number; postMentions: number; score: number }
export interface TrendingTech    { tech: string; jobs: number; posts: number; score: number }
export interface TrendingCommunity {
  id: string; slug: string; name: string; icon?: string | null; accent?: string | null;
  membersCount: number; newJoiners: number; recentMessages: number; score: number;
}

export interface TrendingOverview {
  generatedAt: string;
  posts: TrendingPost[];
  jobs: TrendingJob[];
  skills: TrendingSkill[];
  technologies: TrendingTech[];
  communities: TrendingCommunity[];
}

const TECH_VOCAB = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust',
  'Swift', 'Kotlin', 'Vue', 'Svelte', 'Tailwind', 'PostgreSQL', 'MongoDB', 'Redis',
  'GraphQL', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'PyTorch', 'TensorFlow',
  'Figma', 'Solidity', 'Bun'
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const trendingService = {
  async getOverview(force = false): Promise<TrendingOverview> {
    if (!force) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch { /* fall through */ }
      }
    }
    const overview = await this.compute();
    await redis.set(CACHE_KEY, JSON.stringify(overview), 'EX', CACHE_TTL_SECONDS);
    return overview;
  },

  async compute(): Promise<TrendingOverview> {
    const since = new Date(Date.now() - WINDOW_MS);
    const [posts, jobs, skills, technologies, communities] = await Promise.all([
      this.computePosts(since),
      this.computeJobs(since),
      this.computeSkills(since),
      this.computeTechnologies(since),
      this.computeCommunities(since)
    ]);
    return { generatedAt: new Date().toISOString(), posts, jobs, skills, technologies, communities };
  },

  async computePosts(since: Date): Promise<TrendingPost[]> {
    // Score = recent likes×3 + comments×4 + reposts×6 + log10(age penalty)
    const pipeline: mongoose.PipelineStage[] = [
      { $match: { deletedAt: null, visibility: 'public', createdAt: { $gte: since } } },
      {
        $addFields: {
          ageHours: { $divide: [{ $subtract: ['$$NOW', '$createdAt'] }, 3_600_000] },
          base: {
            $add: [
              { $multiply: ['$stats.likes', 3] },
              { $multiply: ['$stats.comments', 4] },
              { $multiply: ['$stats.reposts', 6] }
            ]
          }
        }
      },
      {
        $addFields: {
          score: { $divide: ['$base', { $pow: [{ $add: ['$ageHours', 2] }, 1.4] }] }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 10 }
    ];
    const rows = await PostModel.aggregate<any>(pipeline);
    const authorIds = [...new Set(rows.map((r) => String(r.authorId)))];
    const authors = await UserModel.find({ _id: { $in: authorIds } })
      .select('handle name avatar').lean();
    const byId = new Map(authors.map((a) => [String(a._id), a]));
    return rows.map((r) => ({
      id: String(r._id),
      content: r.content,
      createdAt: r.createdAt,
      score: Math.round(r.score * 100) / 100,
      likes: r.stats?.likes ?? 0,
      comments: r.stats?.comments ?? 0,
      reposts: r.stats?.reposts ?? 0,
      author: byId.get(String(r.authorId))
    }));
  },

  async computeJobs(since: Date): Promise<TrendingJob[]> {
    const recentApps = await ApplicationModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const appCount = new Map(recentApps.map((r) => [String(r._id), r.count]));

    const jobs = await JobModel.find({ status: 'open' })
      .sort({ applicantsCount: -1, viewsCount: -1, createdAt: -1 })
      .limit(60).lean();

    const scored = jobs.map((j) => {
      const last24 = appCount.get(String(j._id)) ?? 0;
      const ageDays = Math.max(1, (Date.now() - new Date(j.createdAt as any).getTime()) / 86_400_000);
      const score = last24 * 6 + (j.viewsCount ?? 0) / Math.pow(ageDays + 1, 0.6);
      return { ...j, _score: score, _last24: last24 };
    }).sort((a, b) => b._score - a._score).slice(0, 10);

    const companies = await CompanyModel.find({ _id: { $in: scored.map((j) => j.companyId) } })
      .select('name slug logo').lean();
    const byCompany = new Map(companies.map((c) => [String(c._id), c]));

    return scored.map((j) => ({
      id: String(j._id),
      title: j.title,
      applicantsCount: j.applicantsCount ?? 0,
      viewsCount: j.viewsCount ?? 0,
      createdAt: (j.createdAt as any).toISOString?.() ?? String(j.createdAt),
      applicantsLastDay: j._last24,
      company: byCompany.get(String(j.companyId))
    }));
  },

  async computeSkills(since: Date): Promise<TrendingSkill[]> {
    // Jobs posted in window — skill frequency
    const jobSkills = await JobModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: { path: '$skills', preserveNullAndEmptyArrays: false } },
      { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 40 }
    ]);
    const skillJobMap = new Map(jobSkills.map((s) => [s._id, s.count]));

    // Posts: count occurrences of these skill terms in recent content.
    const top = jobSkills.map((s) => s._id).slice(0, 15);
    const postMap = new Map<string, number>();
    if (top.length) {
      const rows = await PostModel.aggregate<{ _id: string; count: number }>([
        { $match: { deletedAt: null, createdAt: { $gte: since } } },
        { $project: { content: { $toLower: '$content' } } },
        ...top.map<mongoose.PipelineStage>((skill) => ({
          $set: { [`m_${skill.replace(/\s+/g, '_')}`]: { $regexMatch: { input: '$content', regex: escapeRegExp(skill) } } }
        }))
      ]);
      for (const skill of top) {
        const key = `m_${skill.replace(/\s+/g, '_')}` as keyof typeof rows[number];
        postMap.set(skill, rows.filter((r) => r[key]).length);
      }
    }

    return jobSkills.slice(0, 10).map((s) => ({
      skill: s._id,
      jobMentions: s.count,
      postMentions: postMap.get(s._id) ?? 0,
      score: s.count * 2 + (postMap.get(s._id) ?? 0)
    })).sort((a, b) => b.score - a.score);
  },

  async computeTechnologies(since: Date): Promise<TrendingTech[]> {
    // Cross-source: count case-insensitive matches in posts + job skills for a curated vocabulary.
    const out: TrendingTech[] = [];
    for (const tech of TECH_VOCAB) {
      const re = new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i');
      const [jobs, posts] = await Promise.all([
        JobModel.countDocuments({
          createdAt: { $gte: since },
          $or: [{ skills: re }, { title: re }, { description: re }]
        }),
        PostModel.countDocuments({
          deletedAt: null, createdAt: { $gte: since },
          content: re
        })
      ]);
      out.push({ tech, jobs, posts, score: jobs * 2 + posts });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 10);
  },

  async computeCommunities(since: Date): Promise<TrendingCommunity[]> {
    const newMembers = await MembershipModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { createdAt: { $gte: since }, bannedAt: null } },
      { $group: { _id: '$communityId', count: { $sum: 1 } } }
    ]);
    const joinMap = new Map(newMembers.map((r) => [String(r._id), r.count]));

    const list = await CommunityModel.find({ visibility: 'public' })
      .sort({ membersCount: -1 }).limit(40).lean();

    const scored = list.map((c) => {
      const joins = joinMap.get(String(c._id)) ?? 0;
      const score = joins * 5 + Math.log10(c.membersCount + 1) * 2;
      return { c, joins, score };
    }).sort((a, b) => b.score - a.score).slice(0, 8);

    return scored.map(({ c, joins, score }) => ({
      id: String(c._id),
      slug: c.slug, name: c.name, icon: c.icon, accent: c.accent,
      membersCount: c.membersCount ?? 0,
      newJoiners: joins,
      recentMessages: 0, // optional future expansion
      score: Math.round(score * 100) / 100
    }));
  }
};
