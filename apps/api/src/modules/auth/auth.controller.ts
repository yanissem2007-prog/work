import { z } from 'zod';
import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { UserModel, ROLES } from './auth.model';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import { awardXp } from '../gamification/xp.service';

const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
  name: z.string().min(2).max(80),
  handle: z.string().min(3).max(24).regex(/^[a-z0-9_]+$/, 'lowercase letters, digits, underscores'),
  role: z.enum(ROLES).default('student'),
  companyName: z.string().min(2).max(80).optional(),
  universityName: z.string().min(2).max(120).optional(),
  yearOfStudy: z.number().int().min(1).max(10).optional(),
  headline: z.string().max(160).optional()
}).superRefine((v, ctx) => {
  if ((v.role === 'recruiter' || v.role === 'company') && !v.companyName) {
    ctx.addIssue({ path: ['companyName'], code: 'custom', message: 'Required for this role' });
  }
  if (v.role === 'university' && !v.universityName) {
    ctx.addIssue({ path: ['universityName'], code: 'custom', message: 'Required' });
  }
});

const LoginDto = z.object({ email: z.string().email(), password: z.string() });
const EmailDto = z.object({ email: z.string().email() });
const TokenDto = z.object({ token: z.string().min(8) });
const ResetDto = z.object({ token: z.string().min(8), password: z.string().min(8).max(120) });
const ChangePasswordDto = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(120) });

const REFRESH_COOKIE = 'work_rt';
// Path '/' so the Next.js middleware (running on the web origin) can see the
// cookie on protected routes like /home — not just on /api/v1/auth. `secure`
// is disabled in dev so the cookie is stored over plain http://localhost.
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const authController = {
  async register(req: Request, res: Response) {
    const data = RegisterDto.parse(req.body);
    const { tokens, user } = await authService.register(data);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts);
    void awardXp(user.id, 'auth.signup');
    return created(res, { accessToken: tokens.accessToken, user });
  },

  async login(req: Request, res: Response) {
    const { email, password } = LoginDto.parse(req.body);
    const { tokens, user } = await authService.login(email, password);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts);
    return ok(res, { accessToken: tokens.accessToken, user });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) throw new HttpError(401, 'NO_REFRESH', 'No refresh token');
    const { accessToken, refreshToken } = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    return ok(res, { accessToken });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, cookieOpts);
    return ok(res, { ok: true });
  },

  async me(req: Request, res: Response) {
    const user = await UserModel.findById(req.user!.sub).select('-passwordHash -oauth').lean();
    return ok(res, user);
  },

  async verifyEmail(req: Request, res: Response) {
    const { token } = TokenDto.parse(req.body);
    const user = await authService.verifyEmail(token);
    return ok(res, user);
  },

  async resendVerification(req: Request, res: Response) {
    const u = await UserModel.findById(req.user!.sub).lean();
    if (!u) throw new HttpError(404, 'NOT_FOUND', 'User');
    if (u.emailVerified) return ok(res, { alreadyVerified: true });
    await authService.sendVerificationEmail(String(u._id), u.email);
    return ok(res, { sent: true });
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = EmailDto.parse(req.body);
    await authService.requestPasswordReset(email);
    return ok(res, { ok: true }); // no enumeration
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = ResetDto.parse(req.body);
    await authService.resetPassword(token, password);
    return ok(res, { ok: true });
  },

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = ChangePasswordDto.parse(req.body);
    await authService.changePassword(req.user!.sub, currentPassword, newPassword);
    return ok(res, { ok: true });
  }
};
