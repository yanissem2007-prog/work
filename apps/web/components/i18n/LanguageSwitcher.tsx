'use client';
import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, Loader2 } from 'lucide-react';
import { LOCALES, LOCALE_META, type Locale } from '@/i18n/config';
import { setLocale } from '@/app/actions/locale';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'icon' | 'inline';
  className?: string;
}

export function LanguageSwitcher({ variant = 'icon', className }: Props) {
  const current = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) { setOpen(false); return; }
    start(async () => {
      await setLocale(locale);
      // The server action revalidates layout — Next will refresh.
    });
  }

  const meta = LOCALE_META[current];

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 transition',
            variant === 'icon'
              ? 'size-9 rounded-full hover:bg-surface text-muted hover:text-fg justify-center'
              : 'px-3 py-1.5 rounded-pill glass hover:bg-surface-2 text-xs',
            className
          )}
          aria-label="Change language"
        >
          {variant === 'icon'
            ? (pending ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />)
            : <>
                <span className="text-base leading-none">{meta.flag}</span>
                <span className="font-medium">{meta.label}</span>
              </>}
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content asChild align="end" sideOffset={8}>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-[220px] glass-strong rounded-2xl border border-border shadow-xl overflow-hidden z-[120]"
            >
              <div className="px-3 pt-3 pb-1.5">
                <p className="text-2xs uppercase tracking-caps text-muted flex items-center gap-1.5">
                  <Globe size={11} className="text-accent" /> Language
                </p>
              </div>
              <ul className="p-1 max-h-72 overflow-y-auto">
                {LOCALES.map((l, i) => {
                  const m = LOCALE_META[l];
                  const active = l === current;
                  return (
                    <Dropdown.Item key={l} asChild>
                      <motion.li
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => choose(l)}
                        className={cn(
                          'relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition',
                          active ? 'bg-surface-2 text-fg' : 'hover:bg-surface text-fg-soft'
                        )}
                      >
                        <span className="text-lg leading-none">{m.flag}</span>
                        <span className="flex-1 text-sm font-medium">{m.label}</span>
                        {active && (
                          <motion.span layoutId="lang-check"
                            className="size-5 rounded-full bg-accent text-accent-fg grid place-items-center shadow-glow">
                            <Check size={12} />
                          </motion.span>
                        )}
                        <span className="text-2xs text-muted uppercase tracking-caps">{l}</span>
                      </motion.li>
                    </Dropdown.Item>
                  );
                })}
              </ul>
              <div className="px-3 pb-2 pt-1 text-2xs text-muted border-t border-border">
                Auto-detected from your browser.
              </div>
            </motion.div>
          </AnimatePresence>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
