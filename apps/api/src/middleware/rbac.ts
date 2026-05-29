import type { Request, Response, NextFunction } from 'express';
import { HttpError } from './error';
import type { Role } from '../modules/auth/auth.model';

export const PERMISSIONS = {
  student: ['post.create', 'post.react', 'community.join', 'job.apply', 'cv.manage', 'ai.chat'],
  recruiter: ['post.create', 'post.react', 'job.create', 'job.manage', 'application.review'],
  company: ['job.create', 'job.manage', 'company.manage', 'application.review'],
  university: ['student.verify', 'community.create', 'post.create'],
  moderator: ['post.moderate', 'community.moderate', 'user.warn'],
  admin: ['*']
} as const satisfies Record<Role, readonly string[]>;

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][number];

export function hasPermission(role: Role, perm: string): boolean {
  const perms = PERMISSIONS[role] as readonly string[];
  return perms.includes('*') || perms.includes(perm);
}

export const requirePermission = (...perms: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'UNAUTHORIZED', 'Login required'));
    const role = req.user.role as Role;
    if (!perms.some((p) => hasPermission(role, p))) {
      return next(new HttpError(403, 'FORBIDDEN', `Missing permission: ${perms.join(' | ')}`));
    }
    next();
  };
