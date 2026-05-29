'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  state?: 'idle' | 'verifying' | 'success' | 'error';
  autoSubmit?: () => void;
}

/**
 * 6-cell OTP input. Auto-focus, paste support, arrow keys, backspace travel.
 * Each cell is a glass tile with a glowing border that tracks state.
 */
export function OtpInput({ value, onChange, length = 6, state = 'idle', autoSubmit }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (value.length === length) autoSubmit?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function setDigit(i: number, d: string) {
    const clean = d.replace(/\D/g, '').slice(0, 1);
    const next = value.split('');
    next[i] = clean;
    const joined = next.join('').padEnd(length, '').slice(0, length).trimEnd();
    onChange(joined);
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!txt) return;
    e.preventDefault();
    onChange(txt.padEnd(length, '').slice(0, length).trimEnd());
    refs.current[Math.min(txt.length, length - 1)]?.focus();
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => {
        const v = value[i] ?? '';
        const active = i === Math.min(value.length, length - 1);
        return (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <input
              ref={(el) => { refs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1}
              value={v}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              autoComplete="one-time-code"
              className={cn(
                'size-12 sm:size-14 text-center font-display tracking-tightest tabular-nums text-2xl sm:text-3xl',
                'rounded-2xl bg-bg-elev/60 border outline-none transition-all duration-fast',
                'focus:scale-105',
                state === 'error' && 'border-danger shadow-[0_0_24px_oklch(70%_0.22_25_/_0.4)]',
                state === 'success' && 'border-success shadow-[0_0_24px_oklch(78%_0.22_142_/_0.4)]',
                state !== 'error' && state !== 'success' && v && 'border-accent shadow-glow',
                state !== 'error' && state !== 'success' && !v && (active ? 'border-accent/60' : 'border-border')
              )}
            />
            {/* Pulse on active empty cell */}
            {active && !v && state === 'idle' && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-2xl border border-accent/40"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
