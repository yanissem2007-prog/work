'use client';
import { motion } from 'framer-motion';

interface Props { value: number; max: number; tone?: string }

export function TrendingBar({ value, max, tone = 'var(--accent)' }: Props) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="h-full origin-left"
        style={{
          background: `linear-gradient(90deg, var(--accent), ${tone})`,
          boxShadow: `0 0 8px ${tone}`
        }}
      />
    </div>
  );
}
