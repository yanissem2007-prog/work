import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from './error';

export interface JwtClaims { sub: string; role: string; jti?: string }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: JwtClaims }
  }
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'UNAUTHORIZED', 'Missing token'));
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as JwtClaims;
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHORIZED', 'Invalid token'));
  }
}

export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient role'));
    }
    next();
  };
