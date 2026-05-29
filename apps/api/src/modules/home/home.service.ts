import mongoose from 'mongoose';
import { PostModel } from '../posts/posts.model';
import { JobModel } from '../jobs/jobs.model';
import { CompanyModel } from '../jobs/company.model';
import { UserModel } from '../auth/auth.model';
import { CommunityModel, MembershipModel } from '../communities/communities.model';
import { FollowModel, ReactionModel, BookmarkModel } from '../posts/interactions.model';
import { matchService } from '../match/match.service';
import { trendingService } from '../trending/trending.service';
import { postsService } from '../posts/posts.service';

const { Types: { ObjectId } } = mongoose;

export type HomeItem =
  | { kind: 'post'; score: number; data: any }
  | { kind: 'job'; score: number; data: any }
  | { kind: 'people'; score: number; data: { users: any[] } }
  | { kind: 'communities'; score: number; data: { communities: any[] } }
  | { kind: 'course'; score: number; data: { title: string; description: string; url?: string; provider: string; skills: string[] } };

export interface HomeFeed {
  items: HomeItem[];
  cursor?: string;
}

const POSTS_PAGE = 14;

export async function buildHomeFeed(userId: string, cursor?: string): Promise<HomeFeed> {
  const since = cursor ? new Date(cursor) : null;

  // 1) Gather user signals in parallel.
  const [me, follows, myMemberships] = await Promise.all([
    UserModel.findById(userId).select('skills').lean(),
    FollowModel.find({ followerId: userId }).select('followingId').lean(),
    MembershipModel.find({ userId, bannedAt: null }).select('communityId').lean()
  ]);
  const followedIds = follows.map((f) => f.followingId);
  const myCommunityIds = myMemberships.map((m) => m.communityId);
  const skills = ((me?.skills as string[]) ?? []).map((s) => s.toLowerCase());

  // 2) Candidate POSTS — from followed users + community members + interest matches.
  const postFilter: Record<string, unknown> = { deletedAt: null, visibility: 'public' };
  if (since) postFilter.createdAt = { $lt: since };

  const orConditions: Record<string, unknown>[] = [];
  if (followedIds.length) orConditions.push({ authorId: { $in: followedIds } });
  if (myCommunityIds.length) orConditions.push({ communityId: { $in: myCommunityIds } });
  if (skills.length) orConditions.push({ tags: { $in: skills } });

  const followedAndOthersFilter = orConditions.length
    ? { ...postFilter, $or: orConditions }
    : postFilter;

  let posts = await PostModel.find(followedAndOthersFilter)
    .sort({ createdAt: -1 }).limit(POSTS_PAGE + 1).lean();

  // Backfill with global recent if too few (cold start)
  if (posts.length < POSTS_PAGE) {
    const seen = new Set(posts.map((p) => String(p._id)));
    const filler = await PostModel.find({
      ...postFilter,
      _id: { $nin: posts.map((p) => p._id) }
    }).sort({ createdAt: -1 }).limit(POSTS_PAGE - posts.length + 1).lean();
    for (const p of filler) if (!seen.has(String(p._id))) posts.push(p);
  }

  const hasMore = posts.length > POSTS_PAGE;
  posts = hasMore ? posts.slice(0, POSTS_PAGE) : posts;
  const nextCursor = hasMore ? posts[posts.length - 1].createdAt?.toISOString() : undefined;

  // Hydrate posts via existing service.
  const hydrated = await postsService.hydrate(posts, userId);

  // Score posts (recency + interest tag boost).
  const scoredPosts = hydrated.map((p) => {
    const ageHours = (Date.now() - new Date(p.createdAt as any).getTime()) / 3_600_000;
    let score = (p.stats.likes ?? 0) + (p.stats.comments ?? 0) * 2 + (p.stats.reposts ?? 0) * 3;
    score = score / Math.pow(ageHours + 2, 1.3);
    if (followedIds.some((id) => String(id) === String(p.author.id))) score += 5;
    if (p.tags?.some((t: string) => skills.includes(t.toLowerCase()))) score += 3;
    return { kind: 'post' as const, score, data: p };
  });

  // 3) JOB recommendations — only on the first page to keep payload small.
  let jobs: HomeItem[] = [];
  let people: HomeItem | null = null;
  let communities: HomeItem | null = null;
  let course: HomeItem | null = null;

  if (!cursor) {
    try {
      const matches = await matchService.topForUser(userId, 4);
      jobs = matches.map((m: any) => ({
        kind: 'job' as const,
        score: m.match,
        data: m
      }));
    } catch { /* tolerate */ }

    // 4) PEOPLE — friends of follows that the user doesn't follow.
    const exclude = new Set([userId, ...followedIds.map(String)]);
    let suggestedUsers: any[] = [];
    if (followedIds.length) {
      const fof = await FollowModel.find({ followerId: { $in: followedIds } }).select('followingId').lean();
      const counts = new Map<string, number>();
      for (const f of fof) {
        const id = String(f.followingId);
        if (exclude.has(id)) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      if (topIds.length) {
        suggestedUsers = await UserModel.find({ _id: { $in: topIds } })
          .select('handle name avatar headline').lean();
      }
    }
    if (suggestedUsers.length === 0) {
      // Cold start fallback: active users with matching skills
      const filter: Record<string, unknown> = { _id: { $ne: new ObjectId(userId) }, status: 'active' };
      if (skills.length) filter.skills = { $in: skills };
      suggestedUsers = await UserModel.find(filter).select('handle name avatar headline')
        .sort({ loginCount: -1, createdAt: -1 }).limit(5).lean();
    }
    if (suggestedUsers.length) {
      people = { kind: 'people', score: 4, data: { users: suggestedUsers } };
    }

    // 5) COMMUNITIES — trending + skill-aligned, not joined.
    const trending = await trendingService.getOverview();
    const notJoined = trending.communities.filter((c) =>
      !myCommunityIds.some((id) => String(id) === c.id)
    ).slice(0, 4);
    let suggested = notJoined;
    if (suggested.length === 0) {
      const fallback = await CommunityModel.find({
        visibility: 'public', _id: { $nin: myCommunityIds }
      }).sort({ membersCount: -1 }).limit(4).lean();
      suggested = fallback.map((c: any) => ({
        id: String(c._id), slug: c.slug, name: c.name, icon: c.icon, accent: c.accent,
        membersCount: c.membersCount ?? 0, newJoiners: 0, score: 0
      })) as any;
    }
    if (suggested.length) {
      communities = { kind: 'communities', score: 4, data: { communities: suggested } };
    }

    // 6) COURSE — single suggested formation based on top skill gap.
    course = await suggestCourse(userId, skills);
  }

  // 7) Interleave: posts as backbone, slot recs every few cards.
  const items: HomeItem[] = [];
  let jobIdx = 0;
  const inserted = { people: false, communities: false, course: false };

  scoredPosts.forEach((p, i) => {
    items.push(p);
    if (jobIdx < jobs.length && (i + 1) % 4 === 0) {
      items.push(jobs[jobIdx++]);
    }
    if (!inserted.people && people && i === 2) { items.push(people); inserted.people = true; }
    if (!inserted.communities && communities && i === 6) { items.push(communities); inserted.communities = true; }
    if (!inserted.course && course && i === 9) { items.push(course); inserted.course = true; }
  });

  // Append leftover job picks at the end of the first page.
  while (jobIdx < jobs.length) items.push(jobs[jobIdx++]);

  return { items, cursor: nextCursor };
}

async function suggestCourse(userId: string, skills: string[]): Promise<HomeItem | null> {
  // Pick a recommended skill not yet on the profile.
  const recents = await JobModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86_400_000) } } },
    { $unwind: '$skills' },
    { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 }
  ]);
  const missing = recents.find((r) => !skills.includes(r._id));
  if (!missing) return null;

  return {
    kind: 'course',
    score: 5,
    data: {
      title: `Master ${capitalize(missing._id)} in 4 weeks`,
      description: `${missing.count} active job posts mention ${missing._id}. Sharpen this skill to unlock more matches.`,
      provider: 'WORK Learn',
      skills: [missing._id],
      url: `/roadmap?prefill=${encodeURIComponent(`I want to learn ${missing._id}`)}`
    }
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
