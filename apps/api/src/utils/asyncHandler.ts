import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 5 types route params as `string | string[]`. Every route param in
// this app is a single value, so narrow `params` to plain strings for handlers
// wrapped by asyncHandler — this keeps call sites clean and type-correct.
export type ApiRequest = Omit<Request, 'params'> & { params: Record<string, string> };

type AsyncFn = (req: ApiRequest, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncFn): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req as ApiRequest, res, next)).catch(next);
