'use client';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface Props {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progress: number;
  totalXp: number;
  compact?: boolean;
}

export function LevelBar({ level, xpInLevel, xpForNext, progress, totalXp, compact }: Props) {
  return (
    <div className={compact ? '' : 'glass rounded-2xl p-5'}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse-glow bg-grad-accent" />
          <div className="relative size-12 rounded-2xl bg-grad-accent shadow-glow grid place-items-center">
            <Zap size={16} className="text-accent-fg" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tighter tabular-nums">Lvl {level}</span>
            <span className="text-2xs text-muted tabular-nums">{totalXp.toLocaleString()} XP</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full origin-left bg-grad-accent shadow-glow"
            />
          </div>
          <p className="mt-1 text-[10px] text-muted tabular-nums">
            {xpInLevel} / {xpForNext} to Lvl {level + 1}
          </p>
        </div>
      </div>
    </div>
  );
}
