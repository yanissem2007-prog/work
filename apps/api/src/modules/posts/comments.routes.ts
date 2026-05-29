import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { CommentModel } from './comments.model';
import { PostModel } from './posts.model';
import { UserModel } from '../auth/auth.model';
import { getIO } from '../../sockets/registry';
import { notify } from '../notifications/notify.service';

const Dto = z.object({ content: z.string().min(1).max(2000), parentId: z.string().optional() });

export const commentsRouter = Router({ mergeParams: true });

commentsRouter.get('/', authRequired, asyncHandler(async (req, res) => {
  const { postId } = req.params as { postId: string };
  const comments = await CommentModel.find({ postId, deletedAt: null })
    .sort({ createdAt: -1 }).limit(60).lean();
  const ids = [...new Set(comments.map((c) => String(c.authorId)))];
  const authors = await UserModel.find({ _id: { $in: ids } }).select('handle name avatar headline').lean();
  const byId = new Map(authors.map((a) => [String(a._id), a]));
  return ok(res, comments.map((c) => ({
    id: String(c._id),
    postId: String(c.postId),
    parentId: c.parentId ? String(c.parentId) : null,
    content: c.content,
    likes: c.likes,
    createdAt: c.createdAt,
    author: byId.get(String(c.authorId))
  })));
}));

commentsRouter.post('/', authRequired, asyncHandler(async (req, res) => {
  const { postId } = req.params as { postId: string };
  const { content, parentId } = Dto.parse(req.body);
  const c = await CommentModel.create({ postId, authorId: req.user!.sub, content, parentId });
  await PostModel.updateOne({ _id: postId }, { $inc: { 'stats.comments': 1, trendingScore: 2 } });
  const author = await UserModel.findById(req.user!.sub).select('handle name avatar headline').lean();
  const payload = {
    id: String(c._id), postId, content: c.content, parentId: parentId ?? null,
    likes: 0, createdAt: c.createdAt, author
  };
  getIO()?.emit('comment:new', payload);
  const post = await PostModel.findById(postId).select('authorId content').lean();
  if (post && String(post.authorId) !== req.user!.sub) {
    void notify({
      userId: String(post.authorId),
      type: 'comment',
      actorId: req.user!.sub,
      target: { kind: 'post', id: postId },
      title: 'commented on your post',
      body: content.slice(0, 100),
      href: `/feed#post-${postId}`
    });
  }
  return created(res, payload);
}));

commentsRouter.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  const c = await CommentModel.findOneAndUpdate(
    { _id: req.params.id, authorId: req.user!.sub },
    { $set: { deletedAt: new Date() } }
  );
  if (c) await PostModel.updateOne({ _id: c.postId }, { $inc: { 'stats.comments': -1 } });
  return ok(res, { ok: true });
}));
