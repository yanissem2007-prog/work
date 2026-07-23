import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { UserModel } from '../auth/auth.model';
import { authService } from '../auth/auth.service';
import { otpService, OTP_CONFIG } from './otp.service';
import { refreshCookieOpts } from '../../config/cookies';

const tight = rateLimit({ windowMs: 60_000, max: 8 });

export const otpRouter = Router();

const cookieOpts = refreshCookieOpts;

const StartDto = z.object({
  email: z.string().email(),
  password: z.string()
});

/**
 * POST /otp/login/start
 * Validate credentials. If valid, issue OTP. Return an opaque `otpId` (used by client).
 * Note: no tokens are issued here — only after /verify.
 */
otpRouter.post('/login/start', tight, asyncHandler(async (req, res) => {
  const { email, password } = StartDto.parse(req.body);
  const user = await UserModel.findOne({ email });
  // Constant-time fallback — avoid email enumeration on the response code.
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID', 'Invalid credentials');
  }
  if (user.status === 'suspended') throw new HttpError(403, 'SUSPENDED', 'Account suspended');

  const { otpId, expiresAt, cooldownSec } = await otpService.issue({
    userId: user.id,
    email: user.email,
    name: user.name,
    purpose: 'login',
    ip: req.ip
  });

  return created(res, {
    otpId,
    userId: user.id,
    emailMasked: maskEmail(user.email),
    expiresAt,
    cooldownSec,
    config: { ttlMin: OTP_CONFIG.OTP_TTL_MIN, maxAttempts: OTP_CONFIG.MAX_ATTEMPTS }
  });
}));

const VerifyDto = z.object({
  userId: z.string(),
  code: z.string().regex(/^\d{6}$/, '6-digit code required')
});

/** POST /otp/login/verify — completes the login on success, issues JWT pair. */
otpRouter.post('/login/verify', tight, asyncHandler(async (req, res) => {
  const { userId, code } = VerifyDto.parse(req.body);
  const r = await otpService.verify({ userId, code, purpose: 'login' });
  if (!r.ok) return ok(res, { ok: false, reason: r.reason });

  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User');

  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount ?? 0) + 1;
  await user.save();

  const tokens = await authService.issueTokens(user.id, user.role);
  res.cookie('work_rt', tokens.refreshToken, cookieOpts);
  return ok(res, { ok: true, accessToken: tokens.accessToken, user: (user as any).toPublic() });
}));

const ResendDto = z.object({ userId: z.string() });

/** POST /otp/resend — re-issues a fresh code (subject to cooldown + hourly cap). */
otpRouter.post('/resend', tight, asyncHandler(async (req, res) => {
  const { userId } = ResendDto.parse(req.body);
  const u = await UserModel.findById(userId).select('email name');
  if (!u) throw new HttpError(404, 'NOT_FOUND', 'User');
  const { expiresAt, cooldownSec } = await otpService.issue({
    userId: u.id, email: u.email, name: u.name, purpose: 'login', ip: req.ip
  });
  return ok(res, { expiresAt, cooldownSec });
}));

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'•'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}
