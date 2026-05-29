'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, Briefcase, Users, User as UserIcon, Building2, MessageSquare, Calendar, ShoppingBag,
  ArrowRight, Command, CornerDownLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchStore } from '@/stores/searchStore';
import { cn } from '@/lib/utils';

const ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  jobs: Briefcase, users: UserIcon, companies: Building2,
  communities: Users, posts: MessageSquare, events: Calendar, gigs: ShoppingBag,
  query: Sparkles
};

const TONE: Record<string, string> = {
  jobs: 'oklch(78% 0.18 200)',
  users: 'oklch(72% 0.2 264)',
  companies: 'oklch(78% 0.22 142)',
  communities: 'oklch(70% 0.24 340)',
  posts: 'oklch(75% 0.22 50)',
  events: 'oklch(78% 0.18 70)',
  gigs: 'oklch(72% 0.2 320)'
};

interface Suggestion { type: string; label: string; hint?: string; href?: string }

export function SearchOverlay() {
  const router = useRouter();
  const { open, setOpen, toggle } = useSearchStore();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(q, 180);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen, toggle]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else { setQ(''); setActive(0); }
  }, [open]);

  const sugg = useQuery<Suggestion[]>({
    enabled: open,
    queryKey: ['search-autocomplete', debounced],
    queryFn: async () => (await api.get('/search/autocomplete', { params: { q: debounced } })).data.data
  });

  const items = sugg.data ?? [];

  function goto(href?: string) {
    if (!href) return;
    setOpen(false);
    router.push(href);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      const t = items[active];
      if (t?.href) goto(t.href);
      else if (q.trim()) goto(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] grid place-items-start pt-24 px-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            onClick={() => setOpen(false)} />

          <motion.div
            initial={{ y: -16, opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: -8, opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl glass-strong rounded-3xl border border-border shadow-xl overflow-hidden"
          >
            {/* Aurora trace */}
            <div className="absolute inset-x-0 top-0 h-px bg-grad-accent shadow-glow opacity-80" />

            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search size={18} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={onKey}
                placeholder="Search jobs, people, companies, communities, posts…"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted"
              />
              <button onClick={() => goto(`/search?q=${encodeURIComponent(q.trim())}`)}
                disabled={!q.trim()}
                className="hidden sm:inline-flex items-center gap-1.5 text-2xs text-accent px-2.5 py-1 rounded-pill border border-accent/30 hover:bg-accent/10 disabled:opacity-40">
                <Sparkles size={11} /> AI search <CornerDownLeft size={11} />
              </button>
              <button onClick={() => setOpen(false)}
                className="size-7 grid place-items-center rounded-full hover:bg-surface text-muted">
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {sugg.isLoading && (
                <p className="text-center text-xs text-muted py-6">Searching…</p>
              )}
              {!sugg.isLoading && items.length === 0 && (
                <p className="text-center text-xs text-muted py-10">Type to search · ⌘K toggles this overlay</p>
              )}

              <ul className="space-y-0.5">
                <AnimatePresence initial={false}>
                  {items.map((s, i) => {
                    const Icon = ICON[s.type] ?? Sparkles;
                    const tone = TONE[s.type] ?? 'var(--accent)';
                    const isActive = i === active;
                    return (
                      <motion.li key={`${s.type}-${s.label}-${i}`}
                        layout
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.02 }}>
                        <button
                          onMouseEnter={() => setActive(i)}
                          onClick={() => goto(s.href)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left',
                            isActive ? 'bg-surface-2' : 'hover:bg-surface'
                          )}
                        >
                          <div className="size-8 rounded-lg grid place-items-center shrink-0 shadow-glow"
                            style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}>
                            <Icon size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.label}</p>
                            {s.hint && <p className="text-2xs text-muted truncate">{s.hint}</p>}
                          </div>
                          <ArrowRight size={13} className={cn('text-muted transition', isActive && 'translate-x-0.5 text-fg')} />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>

            {/* Footer hints */}
            <footer className="border-t border-border px-4 py-2.5 flex items-center justify-between text-2xs text-muted">
              <div className="flex items-center gap-3">
                <Key>↑</Key><Key>↓</Key> navigate
                <Key><CornerDownLeft size={9} /></Key> open
              </div>
              <div className="flex items-center gap-1.5">
                <Key><Command size={9} /></Key><Key>K</Key> toggle
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-surface text-[10px]">
      {children}
    </kbd>
  );
}
