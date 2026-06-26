import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Load .env from the first place it exists, regardless of the working dir
// the API was started from (root, apps/api, etc.).
for (const candidate of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../.env')
]) {
  if (existsSync(candidate)) { loadEnv({ path: candidate }); break; }
}

const Env = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  OAUTH_CALLBACK_BASE: z.string().default('http://localhost:4000/api/v1/auth/oauth'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // Override to use any OpenAI-compatible provider (Groq, OpenRouter, …).
  OPENAI_BASE_URL: z.string().optional(),
  MAILTRAP_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
  MAILTRAP_PORT: z.coerce.number().default(2525),
  MAILTRAP_USER: z.string().optional(),
  MAILTRAP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('"WORK" <no-reply@work.app>')
});

export const env = Env.parse(process.env);
