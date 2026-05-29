'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Square, RotateCcw, Briefcase, FilePenLine, Lightbulb, MessageCircleQuestion, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useAIChat } from '@/hooks/useAIChat';
import { ToolResult } from './ToolResult';
import { cn } from '@/lib/utils';

const QUICK = [
  { icon: Briefcase, label: 'Match me with jobs', prompt: 'Find me 5 jobs that match my skills.' },
  { icon: FilePenLine, label: 'Rewrite my CV bullets', prompt: 'Rewrite a recent CV bullet with measurable outcomes.' },
  { icon: Lightbulb, label: 'Skills I should add', prompt: 'Suggest skills I should add to my profile for a senior product role.' },
  { icon: MessageCircleQuestion, label: 'Mock interview', prompt: 'Run one behavioral interview question for a senior engineer role.' }
];

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export function AIPanel({ open, onOpenChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const { messages, streaming, send, stop, clear } = useAIChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onOpenChange(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onOpenChange]);

  function submit() {
    const v = input.trim(); if (!v) return;
    setInput(''); send(v);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-end p-0 sm:p-4 pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
            onClick={() => onOpenChange(false)} />

          <motion.aside
            initial={{ y: 40, opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 24, opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative pointer-events-auto glass-strong sm:rounded-3xl rounded-t-3xl shadow-xl
                       w-full sm:w-[440px] h-[85dvh] sm:h-[680px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="h-14 px-4 flex items-center gap-3 border-b border-border">
              <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow">
                <Sparkles size={15} className="text-accent-fg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display tracking-tighter text-sm">WORK AI</p>
                <p className="text-2xs text-muted">
                  {streaming ? 'Thinking…' : 'Your career copilot'}
                </p>
              </div>
              {messages.length > 0 && (
                <button onClick={clear} className="size-8 grid place-items-center rounded-full hover:bg-surface text-muted"
                  aria-label="New chat"><RotateCcw size={13} /></button>
              )}
              <Link href="/ai" onClick={() => onOpenChange(false)}
                className="size-8 grid place-items-center rounded-full hover:bg-surface text-muted"
                aria-label="Open full page"><ExternalLink size={13} /></Link>
              <button onClick={() => onOpenChange(false)} className="size-8 grid place-items-center rounded-full hover:bg-surface text-muted"
                aria-label="Close"><X size={14} /></button>
            </header>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center pt-4 pb-6">
                    <h2 className="font-display text-2xl tracking-tighter">
                      Ask me <span className="gradient-text italic">anything</span>.
                    </h2>
                    <p className="text-xs text-muted mt-1">I see your profile, 200k+ jobs, your applications.</p>
                  </motion.div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK.map((q, i) => (
                      <motion.button key={q.label}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => send(q.prompt)}
                        className="text-left glass rounded-2xl p-3 hover:bg-surface-2 transition group">
                        <q.icon size={14} className="text-accent mb-2" />
                        <p className="text-xs font-medium">{q.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((m, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={cn('flex gap-2', m.role === 'user' && 'flex-row-reverse')}
                      >
                        {m.role === 'assistant' ? (
                          <div className="size-7 rounded-lg bg-grad-accent shadow-glow grid place-items-center shrink-0">
                            <Sparkles size={11} className="text-accent-fg" />
                          </div>
                        ) : (
                          <Avatar src={user?.avatar} name={user?.name ?? 'You'} size="xs" />
                        )}
                        <div className={cn('max-w-[85%]', m.role === 'user' && 'items-end')}>
                          {m.content && (
                            <div className={cn(
                              'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed',
                              m.role === 'user'
                                ? 'bg-grad-accent text-accent-fg rounded-tr-sm shadow-glow'
                                : 'bg-surface-2 text-fg rounded-tl-sm'
                            )}>
                              {m.content}
                              {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                                <span className="ml-1 inline-block w-1 h-3 align-middle bg-fg/60 animate-pulse rounded" />
                              )}
                            </div>
                          )}
                          {m.tools?.map((t, ti) => (
                            <ToolResult key={ti} name={t.name} result={t.result} />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 glass rounded-2xl px-3 py-1.5">
                  <textarea
                    ref={taRef} rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                    placeholder="Ask WORK AI…"
                    className="w-full bg-transparent resize-none outline-none text-sm py-1.5 max-h-40"
                  />
                </div>
                {streaming ? (
                  <button onClick={stop}
                    className="size-10 grid place-items-center rounded-2xl bg-surface-2 hover:bg-surface text-fg transition"
                    aria-label="Stop"><Square size={14} /></button>
                ) : (
                  <button onClick={submit} disabled={!input.trim()}
                    className="size-10 grid place-items-center rounded-2xl bg-grad-accent text-accent-fg shadow-glow hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:hover:scale-100"
                    aria-label="Send"><Send size={14} /></button>
                )}
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted">
                WORK AI may make mistakes. Verify important info.
              </p>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
