'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={s} className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ scale: active ? 1 : 0.85 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'size-7 rounded-full grid place-items-center text-2xs font-medium border transition-colors duration-normal',
                  done && 'bg-fg text-bg border-fg',
                  active && 'border-accent text-accent shadow-glow',
                  !active && !done && 'border-border text-muted'
                )}
              >
                {done ? '✓' : i + 1}
              </motion.div>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-border overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  className="h-full bg-fg origin-left"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
