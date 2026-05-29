import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { streamChat } from './services/ai.service';
import { runTool } from './tools';

const ChatDto = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8000)
  })).min(1).max(40)
});

export const aiRouter = Router();

/**
 * Streaming chat over Server-Sent Events.
 * Frame format: data: {"type":"delta"|"tool"|"done", ...}\n\n
 */
aiRouter.post('/chat', authRequired, asyncHandler(async (req, res) => {
  const { messages } = ChatDto.parse(req.body);
  const locale = (req.header('x-locale') ?? req.header('accept-language')?.split(',')[0]?.slice(0, 2) ?? 'en')
    .toLowerCase();
  await streamChat({ userId: req.user!.sub, messages, locale }, res);
}));

const CommandDto = z.object({
  name: z.enum(['recommendJobs', 'improveCvBullets', 'suggestSkills', 'interviewQuestion', 'getMyProfile']),
  args: z.record(z.unknown()).optional()
});

aiRouter.post('/command', authRequired, asyncHandler(async (req, res) => {
  const { name, args } = CommandDto.parse(req.body);
  const result = await runTool(name, args ?? {}, { userId: req.user!.sub });
  return ok(res, result);
}));
