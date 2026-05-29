'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  state: 'idle' | 'thinking' | 'speaking' | 'listening';
  size?: number;
}

const TONE: Record<Props['state'], string> = {
  idle: 'oklch(72% 0.2 264)',
  thinking: 'oklch(78% 0.18 200)',
  speaking: 'oklch(70% 0.24 340)',
  listening: 'oklch(78% 0.22 142)'
};

/** Animated assistant: pulsing orb with rings, color-coded to state. */
export function Assistant({ state, size = 120 }: Props) {
  const c = TONE[state];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${c}, transparent 60%)` }}
        animate={state === 'idle'
          ? { opacity: [0.35, 0.5, 0.35], scale: [1, 1.05, 1] }
          : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.15, 1] }}
        transition={{ duration: state === 'idle' ? 4 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Rings */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border"
          style={{ borderColor: c, width: size - 16 - i * 14, height: size - 16 - i * 14 }}
          animate={state !== 'idle'
            ? { rotate: 360, opacity: [0.4, 0.7, 0.4] }
            : { rotate: 360, opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 12 + i * 4, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
        />
      ))}
      {/* Core */}
      <motion.div
        className={cn('rounded-full grid place-items-center shadow-glow')}
        style={{ width: size * 0.5, height: size * 0.5, background: `linear-gradient(135deg, ${c}, var(--accent))` }}
        animate={state === 'speaking'
          ? { scale: [1, 1.12, 1] }
          : state === 'listening'
          ? { scale: [1, 1.08, 1] }
          : { scale: 1 }}
        transition={{ duration: 0.6, repeat: state === 'idle' ? 0 : Infinity, ease: 'easeInOut' }}
      >
        <span className="block size-2 rounded-full bg-white/90" />
      </motion.div>
    </div>
  );
}
