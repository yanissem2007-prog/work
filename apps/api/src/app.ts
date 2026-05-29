import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import { notFound } from './middleware/notFound';
import { router } from './routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }));

  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
  app.use('/api/v1', router);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
