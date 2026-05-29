import OpenAI from 'openai';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

let _client: OpenAI | null = null;

export function openai(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  _client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _client;
}

export const MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini';

export function isAIEnabled(): boolean {
  const enabled = !!env.OPENAI_API_KEY;
  if (!enabled) logger.warn('OPENAI_API_KEY not set — AI runs in stub mode');
  return enabled;
}
