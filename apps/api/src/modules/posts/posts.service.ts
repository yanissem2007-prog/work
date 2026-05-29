import mongoose from 'mongoose';
import { PostModel } from './posts.model';
import { ReactionModel, BookmarkModel, FollowModel } from './interactions.model';
import { UserModel } from '../auth/auth.model';
import { HttpError } from '../../middleware/error';

const { Types: { ObjectId } } = mongoose;

export interface FeedQuery {
  cursor?: string;       // ISO date
  limit?: number;
  authorId?: string;
  scope?: 'home' | 'trending' | 'following' | 'user';
  userId?: string;       // viewer
}

const authorSelect = 'handle name avatar headline role';

export const postsService = {
  async create(authorId: string, input: {
    content: string;
    media?: { url: string; type: 'image' | 'video'; width?: number; height?: number }[];
    tags?: string[];
    visibility?: 'public' | 'connections' | 'community';
    communityId?: string;
    repostOf?: string;
    quote?: string;
  }) {
    const post = await PostModel.create({ ...input, authorId });
    if (input.repostOf) {
      await PostModel.updateOne({ _id: input.repostOf }, { $inc: { 'stats.reposts': 1 } });
    }
    return this.hydrate([post.toObject()], authorId);
  },

  async delete(authorId: string, postId: string) {
    const r = await PostModel.findOneAndUpdate(
      { _id: postId, authorId },
      { $set: { deletedAt: new Date() } }
    );
    if (!r) throw new HttpError(404, 'NOT_FOUND', 'Post');
  },

  async feed(q: FeedQuery) {
    const limit = Math.min(50, q.limit ?? 20);
    const cursor = q.cursor ? new Date(q.cursor) : null;
    const filter: Record<string, unknown> = { deletedAt: null, visibility: 'public' };

    if (q.scope === 'user' && q.authorId) filter.authorId = new ObjectId(q.authorId);
    if (q.scope === 'following' && q.userId) {
      const following = await FollowModel.find({ followerId: q.userId }).select('followingId').lean();
      filter.authorId = { $in: following.map((f) => f.followingId) };
    }

    if (cursor) filter.createdAt = { $lt: cursor };

    const sort: Record<string, 1 | -1> =
      q.scope === 'trending'
        ? { trendingScore: -1, createdAt: -1 }
        : { createdAt: -1 };

    const docs = await PostModel.find(filter).sort(sort).limit(limit + 1).lean();
    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? slice[slice.length - 1].createdAt?.toISOString() : null;

    const items = await this.hydrate(slice, q.userId);
    return { items, nextCursor };
  },

  /**
   * Personalised recommendation: posts from people followed by people the viewer follows.
   * Falls back to top trending if cold start.
   */
  async recommend(userId: string, limit = 10) {
    const myFollows = await FollowModel.find({ followerId: userId }).select('followingId').lean();
    const myIds = myFollows.map((f) => String(f.followingId));

    let posts;
    if (myIds.length) {
      const fof = await FollowModel.find({ followerId: { $in: myIds } }).select('followingId').lean();
      const ids = [...new Set(fof.map((f) => String(f.followingId)))].filter((id) => id !== userId && !myIds.includes(id));
      posts = await PostModel.find({
        authorId: { $in: ids.map((i) => new ObjectId(i)) },
        deletedAt: null,
        visibility: 'public'
      }).sort({ trendingScore: -1, createdAt: -1 }).limit(limit).lean();
    }

    if (!posts?.length) {
      posts = await PostModel.find({ deletedAt: null, visibility: 'public' })
        .sort({ trendingScore: -1, createdAt: -1 }).limit(limit).lean();
    }
    return this.hydrate(posts, userId);
  },

  async toggleLike(postId: string, userId: string) {
    const existing = await ReactionModel.findOneAndDelete({ postId, userId });
    if (existing) {
      await PostModel.updateOne({ _id: postId }, { $inc: { 'stats.likes': -1 } });
      return { liked: false };
    }
    await ReactionModel.create({ postId, userId, type: 'like' });
    await PostModel.updateOne({ _id: postId }, { $inc: { 'stats.likes': 1, trendingScore: 1 } });
    return { liked: true };
  },

  async toggleBookmark(postId: string, userId: string) {
    const existing = await BookmarkModel.findOneAndDelete({ postId, userId });
    if (existing) {
      await PostModel.updateOne({ _id: postId }, { $inc: { 'stats.bookmarks': -1 } });
      return { bookmarked: false };
    }
    await BookmarkModel.create({ postId, userId });
    await PostModel.updateOne({ _id: postId }, { $inc: { 'stats.bookmarks': 1 } });
    return { bookmarked: true };
  },

  async hydrate(posts: any[], viewerId?: string) {
    if (!posts.length) return [];
    const authorIds = [...new Set(posts.map((p) => String(p.authorId)))];
    const repostIds = posts.map((p) => p.repostOf).filter(Boolean);

    const [authors, reposts, myLikes, myBookmarks] = await Promise.all([
      UserModel.find({ _id: { $in: authorIds } }).select(authorSelect).lean(),
      repostIds.length ? PostModel.find({ _id: { $in: repostIds } }).lean() : Promise.resolve([]),
      viewerId
        ? ReactionModel.find({ userId: viewerId, postId: { $in: posts.map((p) => p._id) } }).select('postId').lean()
        : Promise.resolve([]),
      viewerId
        ? BookmarkModel.find({ userId: viewerId, postId: { $in: posts.map((p) => p._id) } }).select('postId').lean()
        : Promise.resolve([])
    ]);

    const byAuthor = new Map(authors.map((a) => [String(a._id), a]));
    const byRepost = new Map(reposts.map((r) => [String(r._id), r]));
    const liked = new Set(myLikes.map((l) => String(l.postId)));
    const booked = new Set(myBookmarks.map((b) => String(b.postId)));

    return posts.map((p) => ({
      id: String(p._id),
      content: p.content,
      media: p.media,
      tags: p.tags,
      visibility: p.visibility,
      stats: p.stats,
      pinned: p.pinned,
      createdAt: p.createdAt,
      author: { id: String(p.authorId), ...byAuthor.get(String(p.authorId)) },
      repostOf: p.repostOf ? byRepost.get(String(p.repostOf)) : undefined,
      quote: p.quote,
      viewer: { liked: liked.has(String(p._id)), bookmarked: booked.has(String(p._id)) }
    }));
  }
};
