import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, type Role } from './auth.model';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { mail } from '../../config/mail';
import { tokens } from '../../utils/tokens';
import { HttpError } from '../../middleware/error';

const ACCESS_OPTS: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
const REFRESH_OPTS: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
const BCRYPT_ROUNDS = 12;

const SAFE = '-passwordHash -oauth';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  handle: string;
  role: Role;
  companyName?: string;
  universityName?: string;
  yearOfStudy?: number;
  headline?: string;
}

export const authService = {
  async register(input: RegisterInput) {
    const exists = await UserModel.findOne({ $or: [{ email: input.email }, { handle: input.handle }] });
    if (exists) throw new HttpError(409, 'CONFLICT', 'Email or handle taken');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await UserModel.create({
      ...input,
      passwordHash,
      status: 'pending'
    });

    await this.sendVerificationEmail(user.id, user.email);

    const t = await this.issueTokens(user.id, user.role);
    return { tokens: t, user: (user as any).toPublic() };
  },

  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user?.passwordHash) throw new HttpError(401, 'INVALID', 'Invalid credentials');
    if (user.status === 'suspended') throw new HttpError(403, 'SUSPENDED', 'Account suspended');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'INVALID', 'Invalid credentials');

    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount ?? 0) + 1;
    await user.save();

    const t = await this.issueTokens(user.id, user.role);
    return { tokens: t, user: (user as any).toPublic() };
  },

  async issueTokens(userId: string, role: string) {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, ACCESS_OPTS);
    const refreshToken = jwt.sign({ sub: userId, role, jti }, env.JWT_REFRESH_SECRET, REFRESH_OPTS);
    await redis.set(`refresh:${userId}:${jti}`, '1', 'EX', 60 * 60 * 24 * 7);
    return { accessToken, refreshToken };
  },

  async refresh(token: string) {
    let claims;
    try {
      claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; role: string; jti: string };
    } catch {
      throw new HttpError(401, 'INVALID', 'Invalid refresh');
    }
    const key = `refresh:${claims.sub}:${claims.jti}`;
    const exists = await redis.get(key);
    if (!exists) throw new HttpError(401, 'INVALID', 'Refresh revoked');
    await redis.del(key);
    return this.issueTokens(claims.sub, claims.role);
  },

  async logout(token?: string) {
    if (!token) return;
    try {
      const claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
      await redis.del(`refresh:${claims.sub}:${claims.jti}`);
    } catch { /* noop */ }
  },

  async revokeAll(userId: string) {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length) await redis.del(...keys);
  },

  // ─────── Email verification ───────
  async sendVerificationEmail(userId: string, email: string) {
    const token = await tokens.issue('verify', userId);
    const url = `${env.CORS_ORIGIN.split(',')[0]}/verify-email?token=${token}`;
    await mail.send({
      to: email,
      subject: 'Verify your WORK email',
      html: `<p>Welcome to WORK.</p><p><a href="${url}">Verify your email</a></p><p>Link expires in 24h.</p>`
    });
  },

  async verifyEmail(token: string) {
    const userId = await tokens.consume('verify', token);
    if (!userId) throw new HttpError(400, 'INVALID_TOKEN', 'Invalid or expired token');
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { emailVerified: true, emailVerifiedAt: new Date(), status: 'active' } },
      { new: true }
    ).lean();
    return user;
  },

  // ─────── Password reset ───────
  async requestPasswordReset(email: string) {
    const user = await UserModel.findOne({ email });
    // Don't leak existence — silently succeed.
    if (!user) return;
    const token = await tokens.issue('reset', user.id);
    const url = `${env.CORS_ORIGIN.split(',')[0]}/reset-password?token=${token}`;
    await mail.send({
      to: email,
      subject: 'Reset your WORK password',
      html: `<p><a href="${url}">Reset password</a></p><p>Link expires in 30 minutes. If you didn't request this, ignore.</p>`
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const userId = await tokens.consume('reset', token);
    if (!userId) throw new HttpError(400, 'INVALID_TOKEN', 'Invalid or expired token');
    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await UserModel.findByIdAndUpdate(userId, { $set: { passwordHash: hash } });
    await this.revokeAll(userId); // invalidate sessions everywhere
  },

  // ─────── OAuth upsert ───────
  async upsertFromOAuth(p: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
    name: string;
    avatar?: string;
    username?: string;
  }) {
    const match =
      (await UserModel.findOne({ [`oauth.${p.provider}.id`]: p.providerId })) ??
      (await UserModel.findOne({ email: p.email }));

    if (match) {
      match.oauth = match.oauth ?? ({} as any);
      (match.oauth as any)[p.provider] =
        p.provider === 'google'
          ? { id: p.providerId, email: p.email }
          : { id: p.providerId, username: p.username };
      if (!match.emailVerified) {
        match.emailVerified = true;
        match.emailVerifiedAt = new Date();
        match.status = 'active';
      }
      await match.save();
      return match;
    }

    const handleBase = (p.username ?? p.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const handle = `${handleBase}_${crypto.randomBytes(2).toString('hex')}`;

    return UserModel.create({
      email: p.email,
      name: p.name,
      handle,
      avatar: p.avatar,
      role: 'student',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active',
      oauth:
        p.provider === 'google'
          ? { google: { id: p.providerId, email: p.email } }
          : { github: { id: p.providerId, username: p.username } }
    });
  }
};
