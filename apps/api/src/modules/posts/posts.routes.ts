import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { postsService } from './posts.service';
import { commentsRouter } from './comments.routes';
import { CommentModel } from './comments.model';
import { BookmarkModel } from './interactions.model';
import { PostModel } from './posts.model';
import { getIO } from '../../sockets/registry';
import { awardXp } from '../gamification/xp.service';
import { notify } from '../notifications/notify.service';

const CreateDto = z.object({
  content: z.string().min(1).max(4000),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video']),
    width: z.number().optional(),
    height: z.number().optional()
  })).max(4).optional(),
  tags: z.array(z.string()).max(8).optional(),
  visibility: z.enum(['public', 'connections', 'community']).optional(),
  communityId: z.string().optional(),
  repostOf: z.string().optional(),
  quote: z.string().max(1000).optional()
});

export const postRouter = Router();

postRouter.use('/:postId/comments', commentsRouter);

postRouter.get('/feed', authRequired, asyncHandler(async (req, res) => {
  const scope = (req.query.scope as 'home' | 'trending' | 'following') ?? 'home';
  const result = await postsService.feed({
    scope, cursor: req.query.cursor as string, userId: req.user!.sub,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  });
  return ok(res, result.items, { cursor: result.nextCursor ?? undefined });
}));

postRouter.get('/trending', authRequired, asyncHandler(async (req, res) => {
  const result = await postsService.feed({ scope: 'trending', userId: req.user!.sub, limit: 10 });
  return ok(res, result.items);
}));

postRouter.get('/recommended', authRequired, asyncHandler(async (req, res) => {
  const items = await postsService.recommend(req.user!.sub);
  return ok(res, items);
}));

postRouter.get('/bookmarks', authRequired, asyncHandler(async (req, res) => {
  const marks = await BookmarkModel.find({ userId: req.user!.sub }).sort({ createdAt: -1 }).lean();
  const posts = await PostModel.find({ _id: { $in: marks.map((m) => m.postId) }, deletedAt: null }).lean();
  return ok(res, await postsService.hydrate(posts, req.user!.sub));
}));

postRouter.get('/user/:handle', authRequired, asyncHandler(async (req, res) => {
  const { UserModel } = await import('../auth/auth.model');
  const u = await UserModel.findOne({ handle: req.params.handle }).select('_id').lean();
  if (!u) return ok(res, []);
  const result = await postsService.feed({ scope: 'user', authorId: String(u._id), userId: req.user!.sub });
  return ok(res, result.items, { cursor: result.nextCursor ?? undefined });
}));

// Single post permalink (must stay after the literal GET routes above so
// '/feed', '/trending', etc. are matched before the dynamic ':id').
postRouter.get('/:id', authRequired, asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'NOT_FOUND', 'Post');
  const post = await PostModel.findOne({ _id: id, deletedAt: null }).lean();
  if (!post) throw new HttpError(404, 'NOT_FOUND', 'Post');
  void PostModel.updateOne({ _id: id }, { $inc: { 'stats.views': 1 } }).catch(() => {});
  const [hydrated] = await postsService.hydrate([post], req.user!.sub);
  return ok(res, hydrated);
}));

postRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = CreateDto.parse(req.body);
  const [post] = await postsService.create(req.user!.sub, data);
  getIO()?.emit('post:new', post);
  void awardXp(req.user!.sub, 'post.create');
  return created(res, post);
}));

postRouter.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  await postsService.delete(req.user!.sub, req.params.id);
  getIO()?.emit('post:deleted', { id: req.params.id });
  return ok(res, { ok: true });
}));

postRouter.post('/:id/like', authRequired, asyncHandler(async (req, res) => {
  const r = await postsService.toggleLike(req.params.id, req.user!.sub);
  getIO()?.emit('post:reaction', { postId: req.params.id, liked: r.liked, userId: req.user!.sub });
  if (r.liked) {
    const post = await PostModel.findById(req.params.id).select('authorId content').lean();
    if (post && String(post.authorId) !== req.user!.sub) {
      void notify({
        userId: String(post.authorId),
        type: 'like',
        actorId: req.user!.sub,
        target: { kind: 'post', id: req.params.id },
        title: 'liked your post',
        body: (post.content ?? '').slice(0, 80),
        href: `/feed#post-${req.params.id}`
      });
    }
  }
  return ok(res, r);
}));

postRouter.post('/:id/bookmark', authRequired, asyncHandler(async (req, res) => {
  const r = await postsService.toggleBookmark(req.params.id, req.user!.sub);
  return ok(res, r);
}));

postRouter.post('/:id/repost', authRequired, asyncHandler(async (req, res) => {
  const quote = z.string().max(1000).optional().parse(req.body?.quote);
  const [post] = await postsService.create(req.user!.sub, {
    content: quote ?? '', repostOf: req.params.id, quote
  });
  getIO()?.emit('post:new', post);
  return created(res, post);
}));
