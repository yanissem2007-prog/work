import { Router } from 'express';
import crypto from 'crypto';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/error';

export const mediaRouter = Router();

/**
 * Sign a Cloudinary unsigned-direct-upload request.
 * Client uploads directly to Cloudinary — server never sees file bytes.
 */
mediaRouter.post('/sign', authRequired, asyncHandler(async (req, res) => {
  if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
    throw new HttpError(503, 'NOT_CONFIGURED', 'Cloudinary not configured');
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = (req.body.folder as string | undefined) ?? `work/${req.user!.sub}`;
  const params = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(params + env.CLOUDINARY_API_SECRET).digest('hex');

  return ok(res, {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`
  });
}));
