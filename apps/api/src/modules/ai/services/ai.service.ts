import type { Response } from 'express';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { openai, MODEL, isAIEnabled } from './openai';
import { SYSTEM_PROMPT } from './prompts';
import { tools, runTool } from '../tools';
import { UserModel } from '../../auth/auth.model';
import { logger } from '../../../config/logger';

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
    { role: 'system', content: SYSTEM_PROMPT(user ?? {}, input.locale) },
    ...input.messages.map((m) => ({ role: m.role, content: m.content } as ChatCompletionMessageParam))
  ];

  // No OpenAI key — fallback to a deterministic stub that still streams.
  if (!isAIEnabled()) {
    const last = input.messages[input.messages.length - 1]?.content ?? '';
    const reply = `Echo (AI stub — set OPENAI_API_KEY to enable real model): ${last.slice(0, 240)}`;
    for (const chunk of reply.match(/.{1,12}/g) ?? []) {
      write({ type: 'delta', value: chunk });
      await new Promise((r) => setTimeout(r, 30));
    }
    write({ type: 'done' });
    return res.end();
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
      return res.end();
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
  return res.end();
}
