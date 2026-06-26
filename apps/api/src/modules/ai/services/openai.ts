import OpenAI from 'openai';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

let _client: OpenAI | null = null;

export function openai(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  // baseURL lets you point at any OpenAI-compatible API (Groq, OpenRouter…).
  _client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, baseURL: env.OPENAI_BASE_URL || undefined });
  return _client;
}

// Set AI_MODEL to match your provider (e.g. Groq: llama-3.3-70b-versatile).
export const MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini';

export function isAIEnabled(): boolean {
  const enabled = !!env.OPENAI_API_KEY;
  if (!enabled) logger.warn('OPENAI_API_KEY not set — AI runs in stub mode');
  return enabled;
}
