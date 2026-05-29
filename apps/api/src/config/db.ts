import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: env.NODE_ENV !== 'production' });
  logger.info('mongo connected');
}
