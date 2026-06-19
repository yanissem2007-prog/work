import pino from 'pino';
import { env } from './env';

/**
 * Plain pino logger. We avoid the `pino-pretty` transport so the API never
 * crashes when that optional dev dependency isn't installed. Logs are still
 * readable JSON; install pino-pretty + pipe through it if you want colors:
 *   npm run dev:api | npx pino-pretty
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug'
});
