import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OtpModel } from './otp.model';
import { redis } from '../../config/redis';
import { sendOtpEmail } from './mail.service';
import { HttpError } from '../../middleware/error';
import { logger } from '../../config/logger';

const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 45;
const PER_HOUR_LIMIT = 6;

const cooldownKey = (uid: string) => `otp:cd:${uid}`;
const hourlyKey   = (uid: string) => `otp:rate:${uid}`;

function generateCode(): string {
  // 6 digits, uniform, padded.
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

export const otpService = {
  /**
   * Issue a fresh OTP for the user. Enforces resend cooldown + per-hour ceiling.
   * Invalidates prior unverified OTPs for the same purpose.
   */
  async issue(opts: {
    userId: string;
    email: string;
    name?: string;
    purpose?: 'login' | 'signup' | 'sensitive';
    ip?: string;
  }): Promise<{ otpId: string; expiresAt: Date; cooldownSec: number }> {
    const purpose = opts.purpose ?? 'login';

    // Resend cooldown
    const cd = await redis.ttl(cooldownKey(opts.userId));
    if (cd > 0) throw new HttpError(429, 'COOLDOWN', `Wait ${cd}s before another code`);

    // Hourly cap
    const hits = await redis.incr(hourlyKey(opts.userId));
    if (hits === 1) await redis.expire(hourlyKey(opts.userId), 3600);
    if (hits > PER_HOUR_LIMIT) throw new HttpError(429, 'RATE_LIMIT', 'Too many codes — try again later');

    // Invalidate previous unverified codes of this purpose.
    await OtpModel.deleteMany({ userId: opts.userId, purpose, verified: false });

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);
    const doc = await OtpModel.create({
      email: opts.email, userId: opts.userId, codeHash, purpose, sentTo: opts.email,
      ip: opts.ip, expiresAt
    });

    // Mark cooldown.
    await redis.set(cooldownKey(opts.userId), '1', 'EX', RESEND_COOLDOWN_SEC);

    // Fire-and-forget mail; do not block the response on slow SMTP.
    sendOtpEmail({ to: opts.email, name: opts.name, code, minutes: OTP_TTL_MIN })
      .catch((e) => logger.error(e, 'sendOtpEmail failed'));

    return { otpId: String(doc._id), expiresAt, cooldownSec: RESEND_COOLDOWN_SEC };
  },

  /**
   * Verify an OTP. Increments attempts; locks out after MAX_ATTEMPTS.
   */
  async verify(opts: { userId: string; code: string; purpose?: 'login' | 'signup' | 'sensitive' }):
    Promise<{ ok: true } | { ok: false; reason: string }> {
    const purpose = opts.purpose ?? 'login';
    const doc = await OtpModel.findOne({ userId: opts.userId, purpose, verified: false })
      .sort({ createdAt: -1 });
    if (!doc) throw new HttpError(404, 'NOT_FOUND', 'No active code — request a new one');
    if (doc.expiresAt.getTime() < Date.now()) {
      throw new HttpError(410, 'EXPIRED', 'Code expired — request a new one');
    }
    if (doc.attempts >= MAX_ATTEMPTS) {
      throw new HttpError(423, 'LOCKED', 'Too many attempts — request a new code');
    }

    const ok = await bcrypt.compare(opts.code, doc.codeHash);
    if (!ok) {
      doc.attempts += 1;
      await doc.save();
      return { ok: false, reason: `Wrong code · ${MAX_ATTEMPTS - doc.attempts} attempts left` };
    }
    doc.verified = true;
    await doc.save();
    await redis.del(cooldownKey(opts.userId));
    return { ok: true };
  }
};

export const OTP_CONFIG = { OTP_TTL_MIN, MAX_ATTEMPTS, RESEND_COOLDOWN_SEC, PER_HOUR_LIMIT };
