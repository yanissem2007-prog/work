'use client';
import { useCallback, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolEvent[];
}

export interface ToolEvent {
  name: string;
  result: unknown;
}

interface ChatOptions { onDone?: () => void }

export function useAIChat(options: ChatOptions = {}) {
  const locale = useLocale();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (prompt: string) => {
    const text = prompt.trim();
    if (!text || streaming) return;

    const next: AIMessage[] = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(next);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
        method: 'POST',
        signal: ctrl.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Locale': locale,
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`
        },
        body: JSON.stringify({
          messages: next.slice(0, -1).map(({ role, content }) => ({ role, content }))
        })
      });

      if (!res.ok || !res.body) throw new Error('ai stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          if (!frame.startsWith('data: ')) continue;
          let evt: any;
          try { evt = JSON.parse(frame.slice(6)); } catch { continue; }
          if (evt.type === 'delta') {
            setMessages((prev) => {
              const arr = [...prev];
              const last = arr[arr.length - 1];
              arr[arr.length - 1] = { ...last, content: last.content + evt.value };
              return arr;
            });
          } else if (evt.type === 'tool') {
            setMessages((prev) => {
              const arr = [...prev];
              const last = arr[arr.length - 1];
              arr[arr.length - 1] = { ...last, tools: [...(last.tools ?? []), { name: evt.name, result: evt.result }] };
              return arr;
            });
          } else if (evt.type === 'done') {
            setStreaming(false);
            options.onDone?.();
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages((prev) => {
          const arr = [...prev];
          arr[arr.length - 1] = { role: 'assistant', content: 'Sorry — something went wrong. Try again.' };
          return arr;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, options]);

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clear = useCallback(() => setMessages([]), []);

  return { messages, streaming, send, stop, clear };
}
