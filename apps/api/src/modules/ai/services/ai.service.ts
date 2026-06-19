import type { Response } from 'express';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { openai, MODEL, isAIEnabled } from './openai';
import { SYSTEM_PROMPT } from './prompts';
import { tools, runTool } from '../tools';
import { planLocalReply } from './localAssistant';
import { UserModel } from '../../auth/auth.model';
import { logger } from '../../../config/logger';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stream text word-by-word so the built-in assistant feels like a live model. */
async function streamText(write: (o: unknown) => void, text: string): Promise<void> {
  const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
  for (const tok of tokens) {
    write({ type: 'delta', value: tok });
    await sleep(16);
  }
}

export interface ChatInput {
  userId: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  locale?: string;
}

/**
 * Stream a chat reply over Server-Sent Events.
 * Event types written to the response:
 *  - data: {"type":"delta","value":"...text..."}
 *  - data: {"type":"tool","name":"...","args":{...},"result":{...}}
 *  - data: {"type":"done"}
 */
export async function streamChat(input: ChatInput, res: Response): Promise<void> {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();

  const write = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const user = await UserModel.findById(input.userId).lean();
  const baseMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT((user ?? {}) as any, input.locale) },
    ...input.messages.map((m) => ({ role: m.role, content: m.content } as ChatCompletionMessageParam))
  ];

  // No OpenAI key — use the built-in career assistant. It detects intent,
  // pulls real platform data via the tool layer, and streams a grounded reply
  // plus a rich tool card. Fully functional without any external API.
  if (!isAIEnabled()) {
    const last = input.messages[input.messages.length - 1]?.content ?? '';
    try {
      const plan = await planLocalReply(last, input.userId, input.locale ?? 'en');
      await streamText(write, plan.intro);
      if (plan.tool) {
        let result: unknown = null;
        try {
          result = await runTool(plan.tool.name, plan.tool.args, { userId: input.userId });
        } catch (e) {
          logger.error(e, `local tool ${plan.tool.name} failed`);
        }
        if (result) write({ type: 'tool', name: plan.tool.name, result });
      }
      if (plan.closing) {
        write({ type: 'delta', value: '\n\n' });
        await streamText(write, plan.closing);
      }
    } catch (e) {
      logger.error(e, 'local assistant failed');
      write({ type: 'delta', value: 'Sorry — I hit a snag. Please try again.' });
    }
    write({ type: 'done' });
    res.end(); return;
  }

  const client = openai()!;
  let conversation = [...baseMessages];

  // Loop: model → maybe tools → model → … until no more tool_calls.
  for (let step = 0; step < 4; step++) {
    let assistantText = '';
    const toolCalls: { id: string; name: string; argsBuf: string }[] = [];

    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: conversation,
      tools,
      tool_choice: 'auto',
      stream: true,
      temperature: 0.4
    });

    for await (const part of stream) {
      const delta = part.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        assistantText += delta.content;
        write({ type: 'delta', value: delta.content });
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          toolCalls[idx] ??= { id: tc.id ?? '', name: '', argsBuf: '' };
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.function?.name) toolCalls[idx].name += tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].argsBuf += tc.function.arguments;
        }
      }
    }

    if (toolCalls.length === 0) {
      // Pure text turn — done.
      write({ type: 'done' });
      res.end(); return;
    }

    // Persist assistant turn (text + tool_calls) into the conversation
    conversation.push({
      role: 'assistant',
      content: assistantText || null,
      tool_calls: toolCalls.map((t) => ({
        id: t.id,
        type: 'function',
        function: { name: t.name, arguments: t.argsBuf || '{}' }
      }))
    } as any);

    // Execute every tool, append results
    for (const tc of toolCalls) {
      let result: unknown;
      try {
        const args = tc.argsBuf ? JSON.parse(tc.argsBuf) : {};
        result = await runTool(tc.name, args, { userId: input.userId });
      } catch (e) {
        logger.error(e, `tool ${tc.name} failed`);
        result = { error: 'tool_failed' };
      }
      write({ type: 'tool', name: tc.name, result });
      conversation.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result)
      } as any);
    }
  }

  write({ type: 'done' });
  res.end();
}
