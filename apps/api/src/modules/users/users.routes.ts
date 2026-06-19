import { Router } from 'express';
import { z } from 'zod';
import { UserModel } from '../auth/auth.model';
import { ProfileModel } from './profile.model';
import { FollowModel } from '../posts/interactions.model';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { socialRouter } from './social.routes';

export const userRouter = Router();

userRouter.use('/', socialRouter);

userRouter.get('/search', authRequired, asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const users = q
    ? await UserModel.find({ $text: { $search: q } })
        .select('handle name avatar headline role')
        .limit(20).lean()
    : [];
  return ok(res, users);
}));

userRouter.get('/:handle', asyncHandler(async (req, res) => {
  const user = await UserModel.findOne({ handle: req.params.handle })
    .select('-passwordHash -oauth').lean();
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User');
  const profile = await ProfileModel.findOne({ userId: user._id }).lean();
  const [followers, following] = await Promise.all([
    FollowModel.countDocuments({ followingId: user._id }),
    FollowModel.countDocuments({ followerId: user._id })
  ]);
  return ok(res, { ...user, profile, counts: { followers, following } });
}));

const UpdateUserDto = z.object({
  name: z.string().min(2).max(80).optional(),
  headline: z.string().max(160).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(120).optional(),
  skills: z.array(z.string()).max(40).optional(),
  avatar: z.string().max(500).optional() // absolute URL or relative /uploads path
});

userRouter.patch('/me', authRequired, asyncHandler(async (req, res) => {
  const data = UpdateUserDto.parse(req.body);
  const updated = await UserModel.findByIdAndUpdate(req.user!.sub, { $set: data }, { new: true })
    .select('-passwordHash -oauth').lean();
  return ok(res, updated);
}));

const UpdateProfileDto = z.object({
  cover: z.string().max(500).optional(), // absolute URL or relative /uploads path
  pronouns: z.string().max(30).optional(),
  experience: z.array(z.object({
    company: z.string(), role: z.string(),
    start: z.string().optional(), end: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().optional(), location: z.string().optional()
  })).optional(),
  education: z.array(z.object({
    school: z.string(), degree: z.string().optional(), field: z.string().optional(),
    start: z.string().optional(), end: z.string().optional(),
    description: z.string().optional()
  })).optional(),
  portfolio: z.array(z.object({
    title: z.string(), url: z.string().url().optional(),
    image: z.string().url().optional(), description: z.string().optional()
  })).optional(),
  socials: z.object({
    twitter: z.string().optional(), github: z.string().optional(),
    linkedin: z.string().optional(), website: z.string().optional(),
    dribbble: z.string().optional()
  }).optional(),
  openToWork: z.boolean().optional(),
  hiring: z.boolean().optional()
});

userRouter.patch('/me/profile', authRequired, asyncHandler(async (req, res) => {
  const data = UpdateProfileDto.parse(req.body);
  const p = await ProfileModel.findOneAndUpdate(
    { userId: req.user!.sub },
    { $set: data },
    { new: true, upsert: true }
  ).lean();
  return ok(res, p);
}));
