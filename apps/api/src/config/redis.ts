import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const pub = redis.duplicate();
export const sub = redis.duplicate();
