import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: 'VALIDATION', message: 'Invalid input', issues: err.issues }
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false, data: null, error: { code: err.code, message: err.message }
    });
  }
  logger.error(err);
  res.status(500).json({
    success: false, data: null,
    error: { code: 'INTERNAL', message: 'Internal server error' }
  });
};
