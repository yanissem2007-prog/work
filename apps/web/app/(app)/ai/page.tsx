'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Square, RotateCcw, Briefcase, FileText, Award, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useAIChat } from '@/hooks/useAIChat';
import { ToolResult } from '@/components/ai/ToolResult';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  { icon: Briefcase, label: 'Match me with jobs', prompt: 'Find me 5 jobs that match my skills and experience.' },
  { icon: FileText, label: 'Rewrite my CV', prompt: 'Rewrite a recent CV bullet with measurable outcomes.' },
  { icon: Award, label: 'Mock interview', prompt: 'Run a behavioral interview question for a Senior engineer.' },
  { icon: Building2, label: 'Negotiate salary', prompt: 'Help me negotiate my offer for a $180k Senior PM role.' }
];

export default function AIPage() {
  const user = useAuthStore((s) => s.user);
  const { messages, streaming, send, stop, clear } = useAIChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  function submit() {
    const v = input.trim(); if (!v) return;
    setInput(''); send(v);
  }

  return (
    <div className="-mx-4 sm:-mx-6 -my-6 h-[100dvh] flex flex-col">
      <header className="h-16 px-4 sm:px-6 border-b border-border flex items-center gap-3 backdrop-blur-md bg-bg/70">
        <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center">
          <Sparkles size={16} className="text-accent-fg" />
        </div>
        <div className="flex-1">
          <p className="font-display tracking-tighter">WORK AI</p>
          <p className="text-2xs text-muted">{streaming ? 'Thinking…' : 'Your career copilot'}</p>
        </div>
        {messages.length > 0 && (
          <Button variant="glass" size="sm" onClick={clear}>
            <RotateCcw size={13} /> New chat
          </Button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="mx-auto size-20 rounded-3xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow">
                <Sparkles size={28} className="text-accent-fg" />
              </div>
              <h1 className="mt-6 font-display text-4xl tracking-tightest">
                What can I help you <span className="gradient-text">build</span>?
              </h1>
              <p className="mt-2 text-muted">
                Ask anything career-related. I see your profile, your applications, and 200k+ live jobs.
              </p>
            </motion.div>

            <div className="mt-10 grid sm:grid-cols-2 gap-3">
              {SUGGESTIONS.map((s, i) => (
                <motion.button key={s.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => send(s.prompt)}
                  className="group glass rounded-2xl p-4 text-left hover:bg-bg-elev/60 transition">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-surface-2 grid place-items-center">
                      <s.icon size={16} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.label}</p>
                      <p className="text-xs text-muted truncate">{s.prompt}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted group-hover:text-fg group-hover:translate-x-0.5 transition" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}
                >
                  {m.role === 'assistant' ? (
                    <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center shrink-0">
                      <Sparkles size={14} className="text-accent-fg" />
                    </div>
                  ) : (
                    <Avatar src={user?.avatar} name={user?.name ?? 'You'} size="sm" />
                  )}
                  <div className={cn('max-w-[80%]', m.role === 'user' && 'items-end')}>
                    {m.content && (
                      <div className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed',
                        m.role === 'user'
                          ? 'bg-grad-accent text-accent-fg rounded-tr-sm shadow-glow'
                          : 'bg-surface-2 text-fg rounded-tl-sm'
                      )}>
                        {m.content}
                        {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                          <span className="ml-1 inline-block w-1.5 h-3.5 align-middle bg-fg/60 animate-pulse rounded" />
                        )}
                      </div>
                    )}
                    {m.tools?.map((t, ti) => <ToolResult key={ti} name={t.name} result={t.result} />)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 backdrop-blur-md bg-bg/70">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 glass rounded-2xl px-4 py-2.5">
            <textarea ref={taRef} rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Ask WORK AI anything…"
              className="w-full bg-transparent resize-none outline-none text-sm max-h-48"
            />
          </div>
          {streaming ? (
            <button onClick={stop}
              className="size-11 grid place-items-center rounded-2xl bg-surface-2 hover:bg-surface text-fg transition"
              aria-label="Stop"><Square size={16} /></button>
          ) : (
            <button onClick={submit} disabled={!input.trim()}
              className="size-11 grid place-items-center rounded-2xl bg-grad-accent text-accent-fg shadow-glow hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send"><Send size={16} /></button>
          )}
        </div>
        <p className="mt-2 text-center text-2xs text-muted">
          WORK AI may produce inaccuracies. Verify important info.
        </p>
      </div>
    </div>
  );
}
