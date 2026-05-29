import { z } from 'zod';
import { JobModel } from '../jobs/jobs.model';
import { CompanyModel } from '../jobs/company.model';
import { UserModel } from '../auth/auth.model';
import { CommunityModel } from '../communities/communities.model';
import { PostModel } from '../posts/posts.model';
import { GigModel } from '../freelance/freelance.model';
import { EventModel } from '../events/events.model';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { embedText, cosine } from '../ai/services/embeddings';
import { logger } from '../../config/logger';

export const SEARCH_TYPES = ['jobs', 'users', 'companies', 'communities', 'posts', 'events', 'gigs'] as const;
export type SearchType = typeof SEARCH_TYPES[number];

export interface SearchHit<T = unknown> {
  type: SearchType;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  href: string;
  score: number;
  meta?: Record<string, unknown>;
  raw?: T;
}

export interface SearchResult {
  q: string;
  groups: Record<SearchType, SearchHit[]>;
  total: number;
  intent?: SearchIntent;
}

export interface SearchIntent {
  primaryType?: SearchType;
  filters?: {
    skills?: string[];
    remote?: boolean;
    minSalary?: number;
    category?: string;
    level?: string;
  };
  rewrittenQuery?: string;
}

const LIMIT_PER_TYPE = 6;

export async function universalSearch(q: string, types?: SearchType[]): Promise<SearchResult> {
  const targets = types?.length ? types : [...SEARCH_TYPES];
  const groups = Object.fromEntries(SEARCH_TYPES.map((t) => [t, [] as SearchHit[]])) as Record<SearchType, SearchHit[]>;
  if (!q || q.trim().length < 2) return { q, groups, total: 0 };

  const re = new RegExp(escapeRegExp(q), 'i');

  const promises: Promise<SearchHit[]>[] = [];
  if (targets.includes('jobs'))        promises.push(searchJobs(q, re));
  if (targets.includes('users'))       promises.push(searchUsers(q, re));
  if (targets.includes('companies'))   promises.push(searchCompanies(q, re));
  if (targets.includes('communities')) promises.push(searchCommunities(q, re));
  if (targets.includes('posts'))       promises.push(searchPosts(q, re));
  if (targets.includes('events'))      promises.push(searchEvents(q, re));
  if (targets.includes('gigs'))        promises.push(searchGigs(q, re));

  const resolved = await Promise.all(promises);
  let i = 0;
  if (targets.includes('jobs'))        groups.jobs        = resolved[i++];
  if (targets.includes('users'))       groups.users       = resolved[i++];
  if (targets.includes('companies'))   groups.companies   = resolved[i++];
  if (targets.includes('communities')) groups.communities = resolved[i++];
  if (targets.includes('posts'))       groups.posts       = resolved[i++];
  if (targets.includes('events'))      groups.events      = resolved[i++];
  if (targets.includes('gigs'))        groups.gigs        = resolved[i++];

  // Optional vector rerank for posts and jobs when AI is enabled.
  if (isAIEnabled() && q.length > 8) {
    try {
      const qVec = await embedText(q);
      if (qVec) {
        for (const type of ['jobs', 'posts'] as const) {
          if (!groups[type]?.length) continue;
          const rescored = await Promise.all(groups[type].map(async (h) => {
            // We don't store post embeddings, but jobs do — only rerank jobs.
            if (type === 'jobs' && h.raw && (h.raw as any).embedding) {
              h.score = h.score + cosine(qVec, (h.raw as any).embedding) * 5;
            }
            return h;
          }));
          groups[type] = rescored.sort((a, b) => b.score - a.score);
        }
      }
    } catch (e) {
      logger.error(e, 'search vector rerank failed');
    }
  }

  const total = Object.values(groups).reduce((s, g) => s + g.length, 0);
  return { q, groups, total };
}

/* ─── Individual searches ─── */

async function searchJobs(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await JobModel.find({
    status: 'open',
    $or: [{ $text: { $search: q } }, { title: re }, { skills: re }]
  }).limit(LIMIT_PER_TYPE).lean();
  const companies = await CompanyModel.find({ _id: { $in: rows.map((j) => j.companyId) } })
    .select('name slug logo').lean();
  const byCompany = new Map(companies.map((c) => [String(c._id), c]));
  return rows.map((j, i) => ({
    type: 'jobs' as const,
    id: String(j._id),
    title: j.title,
    subtitle: byCompany.get(String(j.companyId))?.name,
    image: byCompany.get(String(j.companyId))?.logo,
    href: `/jobs/${j._id}`,
    score: LIMIT_PER_TYPE - i + (j.title.toLowerCase().includes(q.toLowerCase()) ? 3 : 0),
    meta: { remote: j.remote, type: j.type, level: j.experienceLevel },
    raw: j
  }));
}

async function searchUsers(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await UserModel.find({
    $or: [{ name: re }, { handle: re }, { headline: re }, { skills: re }]
  }).select('handle name avatar headline').limit(LIMIT_PER_TYPE).lean();
  return rows.map((u, i) => ({
    type: 'users' as const,
    id: String(u._id),
    title: u.name,
    subtitle: u.headline ?? `@${u.handle}`,
    image: u.avatar,
    href: `/profile/${u.handle}`,
    score: LIMIT_PER_TYPE - i
  }));
}

async function searchCompanies(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await CompanyModel.find({
    $or: [{ name: re }, { description: re }, { tags: re }]
  }).limit(LIMIT_PER_TYPE).lean();
  return rows.map((c, i) => ({
    type: 'companies' as const,
    id: String(c._id),
    title: c.name,
    subtitle: c.industry,
    image: c.logo,
    href: `/companies/${c.slug}`,
    score: LIMIT_PER_TYPE - i
  }));
}

async function searchCommunities(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await CommunityModel.find({
    visibility: 'public',
    $or: [{ name: re }, { description: re }, { tags: re }]
  }).limit(LIMIT_PER_TYPE).lean();
  return rows.map((c, i) => ({
    type: 'communities' as const,
    id: String(c._id),
    title: c.name,
    subtitle: `${c.membersCount?.toLocaleString() ?? 0} members`,
    image: c.icon,
    href: `/communities/${c.slug}`,
    score: LIMIT_PER_TYPE - i,
    meta: { accent: c.accent }
  }));
}

async function searchPosts(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await PostModel.find({
    deletedAt: null,
    visibility: 'public',
    $or: [{ $text: { $search: q } }, { content: re }, { tags: re }]
  }).sort({ createdAt: -1 }).limit(LIMIT_PER_TYPE).lean();
  return rows.map((p, i) => ({
    type: 'posts' as const,
    id: String(p._id),
    title: (p.content ?? '').slice(0, 120),
    subtitle: `${p.stats?.likes ?? 0} likes · ${p.stats?.comments ?? 0} comments`,
    href: `/feed#post-${p._id}`,
    score: LIMIT_PER_TYPE - i
  }));
}

async function searchEvents(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await EventModel.find({
    status: 'published',
    endsAt: { $gte: new Date() },
    $or: [{ $text: { $search: q } }, { title: re }, { tags: re }]
  }).sort({ startsAt: 1 }).limit(LIMIT_PER_TYPE).lean();
  return rows.map((e, i) => ({
    type: 'events' as const,
    id: String(e._id),
    title: e.title,
    subtitle: new Date(e.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    image: e.banner,
    href: `/events/${e.slug}`,
    score: LIMIT_PER_TYPE - i,
    meta: { type: e.type, online: e.online }
  }));
}

async function searchGigs(q: string, re: RegExp): Promise<SearchHit[]> {
  const rows = await GigModel.find({
    status: 'published',
    $or: [{ $text: { $search: q } }, { title: re }, { skills: re }]
  }).limit(LIMIT_PER_TYPE).lean();
  return rows.map((g, i) => ({
    type: 'gigs' as const,
    id: String(g._id),
    title: g.title,
    subtitle: `From $${g.priceFrom ?? '—'} · ${g.deliveryFastest ?? '—'}d`,
    image: g.cover,
    href: `/freelance/gig/${g.slug}`,
    score: LIMIT_PER_TYPE - i,
    meta: { category: g.category }
  }));
}

/* ─── Autocomplete (prefix-fast) ─── */

export interface Suggestion {
  type: 'query' | SearchType;
  label: string;
  hint?: string;
  href?: string;
}

export async function autocomplete(q: string): Promise<Suggestion[]> {
  const trimmed = q.trim();
  if (trimmed.length < 1) return defaultSuggestions();
  const re = new RegExp('^' + escapeRegExp(trimmed), 'i');

  const [users, jobs, companies, communities] = await Promise.all([
    UserModel.find({ $or: [{ name: re }, { handle: re }] }).select('name handle avatar').limit(3).lean(),
    JobModel.find({ status: 'open', title: re }).select('title _id').limit(3).lean(),
    CompanyModel.find({ name: re }).select('name slug').limit(3).lean(),
    CommunityModel.find({ visibility: 'public', name: re }).select('name slug').limit(3).lean()
  ]);

  const out: Suggestion[] = [];
  users.forEach((u) => out.push({ type: 'users', label: u.name, hint: `@${u.handle}`, href: `/profile/${u.handle}` }));
  jobs.forEach((j) => out.push({ type: 'jobs', label: j.title, hint: 'Job', href: `/jobs/${j._id}` }));
  companies.forEach((c) => out.push({ type: 'companies', label: c.name, hint: 'Company', href: `/companies/${c.slug}` }));
  communities.forEach((c) => out.push({ type: 'communities', label: c.name, hint: 'Community', href: `/communities/${c.slug}` }));
  out.push({ type: 'query', label: `Search for "${trimmed}"`, href: `/search?q=${encodeURIComponent(trimmed)}` });
  return out.slice(0, 10);
}

function defaultSuggestions(): Suggestion[] {
  return [
    { type: 'query', label: 'Senior Frontend Engineer remote', href: '/search?q=Senior%20Frontend%20Engineer%20remote' },
    { type: 'query', label: 'AI hackathons this month', href: '/search?q=AI%20hackathons%20this%20month' },
    { type: 'query', label: 'Communities for ML engineers', href: '/search?q=Communities%20for%20ML%20engineers' }
  ];
}

/* ─── AI Intent (parses natural language → filters) ─── */

const IntentZ = z.object({
  primaryType: z.enum(SEARCH_TYPES).optional(),
  filters: z.object({
    skills: z.array(z.string()).optional(),
    remote: z.boolean().optional(),
    minSalary: z.number().optional(),
    category: z.string().optional(),
    level: z.string().optional()
  }).optional(),
  rewrittenQuery: z.string().optional()
});

export async function extractIntent(q: string): Promise<SearchIntent | undefined> {
  if (!isAIEnabled() || q.length < 12) return undefined;
  try {
    const client = openai()!;
    const r = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content:
          `You parse a search query into intent JSON for WORK (jobs/users/companies/communities/posts/events/gigs).
           Output strict JSON: { primaryType?, filters?: { skills?, remote?, minSalary?, category?, level? }, rewrittenQuery? }.
           Only include fields you're confident about. minSalary in USD.` },
        { role: 'user', content: q }
      ]
    });
    return IntentZ.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
  } catch (e) {
    logger.error(e, 'extractIntent failed');
    return undefined;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
