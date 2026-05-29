import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { SEARCH_TYPES, autocomplete, extractIntent, universalSearch } from './search.service';

export const searchRouter = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true });

searchRouter.get('/', limiter, asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const typesParam = String(req.query.types ?? '').split(',').filter(Boolean);
  const validTypes = typesParam.filter((t) => (SEARCH_TYPES as readonly string[]).includes(t)) as typeof SEARCH_TYPES[number][];
  const r = await universalSearch(q, validTypes.length ? validTypes : undefined);
  return ok(res, r);
}));

searchRouter.get('/autocomplete', limiter, asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '');
  return ok(res, await autocomplete(q));
}));

const AiDto = z.object({ q: z.string().min(2).max(400) });

searchRouter.post('/ai', limiter, asyncHandler(async (req, res) => {
  const { q } = AiDto.parse(req.body);
  const intent = await extractIntent(q);
  const result = await universalSearch(intent?.rewrittenQuery ?? q);
  return ok(res, { ...result, intent });
}));
