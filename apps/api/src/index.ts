import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { redis } from './config/redis';
import { attachSockets } from './sockets';
import { logger } from './config/logger';
import { env } from './config/env';
import { startJobs, stopJobs } from './config/jobs';

async function main() {
  await connectDB();
  await redis.ping();

  const app = createApp();
  const server = http.createServer(app);
  attachSockets(server);

  server.listen(env.PORT, () => {
    logger.info(`API listening on :${env.PORT}`);
  });

  await startJobs();

  const shutdown = async () => {
    logger.info('shutting down');
    await stopJobs();
    server.close();
    await redis.quit();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => { logger.error(e); process.exit(1); });
