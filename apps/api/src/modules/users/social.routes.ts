import { Router } from 'express';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { FollowModel, FriendshipModel } from '../posts/interactions.model';
import { UserModel } from '../auth/auth.model';
import { HttpError } from '../../middleware/error';
import { getIO } from '../../sockets/registry';
import { awardXp } from '../gamification/xp.service';
import { notify } from '../notifications/notify.service';

export const socialRouter = Router();

// ─── Follows ───
socialRouter.post('/follow/:userId', authRequired, asyncHandler(async (req, res) => {
  if (req.params.userId === req.user!.sub) throw new HttpError(400, 'SELF', 'Cannot follow yourself');
  await FollowModel.updateOne(
    { followerId: req.user!.sub, followingId: req.params.userId },
    { $setOnInsert: { followerId: req.user!.sub, followingId: req.params.userId } },
    { upsert: true }
  );
  void notify({
    userId: req.params.userId,
    type: 'follow',
    actorId: req.user!.sub,
    target: { kind: 'user', id: req.user!.sub },
    title: 'started following you',
    href: `/profile/${req.user!.sub}`
  });
  return created(res, { followed: true });
}));

socialRouter.delete('/follow/:userId', authRequired, asyncHandler(async (req, res) => {
  await FollowModel.deleteOne({ followerId: req.user!.sub, followingId: req.params.userId });
  return ok(res, { followed: false });
}));

socialRouter.get('/:userId/followers', asyncHandler(async (req, res) => {
  const rows = await FollowModel.find({ followingId: req.params.userId }).sort({ createdAt: -1 }).limit(50).lean();
  const users = await UserModel.find({ _id: { $in: rows.map((r) => r.followerId) } })
    .select('handle name avatar headline').lean();
  return ok(res, users);
}));

socialRouter.get('/:userId/following', asyncHandler(async (req, res) => {
  const rows = await FollowModel.find({ followerId: req.params.userId }).sort({ createdAt: -1 }).limit(50).lean();
  const users = await UserModel.find({ _id: { $in: rows.map((r) => r.followingId) } })
    .select('handle name avatar headline').lean();
  return ok(res, users);
}));

socialRouter.get('/:userId/is-following', authRequired, asyncHandler(async (req, res) => {
  const exists = await FollowModel.exists({ followerId: req.user!.sub, followingId: req.params.userId });
  return ok(res, { following: !!exists });
}));

// ─── Friends ───
socialRouter.post('/friends/:userId/request', authRequired, asyncHandler(async (req, res) => {
  if (req.params.userId === req.user!.sub) throw new HttpError(400, 'SELF', 'Cannot friend yourself');
  const fr = await FriendshipModel.findOneAndUpdate(
    {
      $or: [
        { requesterId: req.user!.sub, addresseeId: req.params.userId },
        { requesterId: req.params.userId, addresseeId: req.user!.sub }
      ]
    },
    {
      $setOnInsert: { requesterId: req.user!.sub, addresseeId: req.params.userId, status: 'pending' }
    },
    { upsert: true, new: true }
  );
  void notify({
    userId: req.params.userId,
    type: 'friend_request',
    actorId: req.user!.sub,
    target: { kind: 'user', id: req.user!.sub },
    title: 'sent you a friend request',
    href: '/friends?tab=requests'
  });
  return created(res, fr);
}));

socialRouter.post('/friends/:id/accept', authRequired, asyncHandler(async (req, res) => {
  const fr = await FriendshipModel.findOneAndUpdate(
    { _id: req.params.id, addresseeId: req.user!.sub, status: 'pending' },
    { $set: { status: 'accepted' } },
    { new: true }
  );
  if (!fr) throw new HttpError(404, 'NOT_FOUND', 'Friendship');
  void awardXp(String(fr.requesterId), 'friend.add');
  void awardXp(String(fr.addresseeId), 'friend.add');
  return ok(res, fr);
}));

socialRouter.delete('/friends/:id', authRequired, asyncHandler(async (req, res) => {
  await FriendshipModel.deleteOne({
    _id: req.params.id,
    $or: [{ requesterId: req.user!.sub }, { addresseeId: req.user!.sub }]
  });
  return ok(res, { ok: true });
}));

socialRouter.get('/friends', authRequired, asyncHandler(async (req, res) => {
  const rows = await FriendshipModel.find({
    status: 'accepted',
    $or: [{ requesterId: req.user!.sub }, { addresseeId: req.user!.sub }]
  }).lean();
  const otherIds = rows.map((r) =>
    String(r.requesterId) === req.user!.sub ? r.addresseeId : r.requesterId
  );
  const friends = await UserModel.find({ _id: { $in: otherIds } })
    .select('handle name avatar headline').lean();
  return ok(res, friends);
}));

socialRouter.get('/friends/requests', authRequired, asyncHandler(async (req, res) => {
  const rows = await FriendshipModel.find({ addresseeId: req.user!.sub, status: 'pending' }).lean();
  const users = await UserModel.find({ _id: { $in: rows.map((r) => r.requesterId) } })
    .select('handle name avatar headline').lean();
  return ok(res, { requests: rows, users });
}));

// ─── Suggestions ───
socialRouter.get('/suggestions', authRequired, asyncHandler(async (req, res) => {
  const already = await FollowModel.find({ followerId: req.user!.sub }).select('followingId').lean();
  const excludeIds = [...already.map((r) => r.followingId), req.user!.sub];
  const users = await UserModel.find({ _id: { $nin: excludeIds }, status: 'active' })
    .select('handle name avatar headline role')
    .sort({ loginCount: -1, createdAt: -1 })
    .limit(6).lean();
  // Normalise to `id` (the shape the client `User` type expects).
  return ok(res, users.map((u) => ({
    id: String(u._id),
    handle: u.handle,
    name: u.name,
    avatar: u.avatar ?? null,
    headline: u.headline ?? null,
    role: u.role
  })));
}));
