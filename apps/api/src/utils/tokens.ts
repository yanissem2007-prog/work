import crypto from 'crypto';
import { redis } from '../config/redis';

type Purpose = 'verify' | 'reset';

const ttl: Record<Purpose, number> = {
  verify: 60 * 60 * 24,   // 24h
  reset: 60 * 30          // 30min
};

const key = (purpose: Purpose, token: string) => `tok:${purpose}:${token}`;

export const tokens = {
  async issue(purpose: Purpose, userId: string) {
    const token = crypto.randomBytes(32).toString('base64url');
    await redis.set(key(purpose, token), userId, 'EX', ttl[purpose]);
    return token;
  },
  async consume(purpose: Purpose, token: string) {
    const k = key(purpose, token);
    const userId = await redis.get(k);
    if (!userId) return null;
    await redis.del(k);
    return userId;
  }
};
