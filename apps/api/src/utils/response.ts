import type { Response } from 'express';

export const ok = <T>(res: Response, data: T, meta?: Record<string, unknown>) =>
  res.json({ success: true, data, error: null, meta });

export const created = <T>(res: Response, data: T) =>
  res.status(201).json({ success: true, data, error: null });
