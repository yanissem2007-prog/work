import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { authController } from './auth.controller';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { initOAuth } from './auth.oauth';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { otpRouter } from '../otp/otp.routes';
import { REFRESH_COOKIE, refreshCookieOpts } from '../../config/cookies';

const tight = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
const normal = rateLimit({ windowMs: 60_000, max: 30 });

export const authRouter = Router();
const passport = initOAuth();

// 2FA / OTP login mounted under /auth/otp/...
authRouter.use('/otp', otpRouter);

authRouter.post('/register', tight, asyncHandler(authController.register));
authRouter.post('/login', tight, asyncHandler(authController.login));
authRouter.post('/refresh', normal, asyncHandler(authController.refresh));
authRouter.post('/logout', normal, asyncHandler(authController.logout));
authRouter.get('/me', authRequired, asyncHandler(authController.me));

authRouter.post('/verify-email', tight, asyncHandler(authController.verifyEmail));
authRouter.post('/resend-verification', authRequired, tight, asyncHandler(authController.resendVerification));

authRouter.post('/forgot-password', tight, asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', tight, asyncHandler(authController.resetPassword));
authRouter.post('/change-password', authRequired, tight, asyncHandler(authController.changePassword));

// ─── OAuth ───
const oauthRedirect = async (res: any, user: any) => {
  const { accessToken, refreshToken } = await authService.issueTokens(user.id, user.role);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOpts);
  const target = `${env.CORS_ORIGIN.split(',')[0]}/oauth/callback#token=${accessToken}`;
  res.redirect(target);
};

if (env.GOOGLE_CLIENT_ID) {
  authRouter.get('/oauth/google',
    passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
  authRouter.get('/oauth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?oauth=failed' }),
    asyncHandler(async (req, res) => oauthRedirect(res, req.user)));
}

if (env.GITHUB_CLIENT_ID) {
  authRouter.get('/oauth/github',
    passport.authenticate('github', { session: false, scope: ['user:email'] }));
  authRouter.get('/oauth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login?oauth=failed' }),
    asyncHandler(async (req, res) => oauthRedirect(res, req.user)));
}
