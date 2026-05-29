'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  items: React.ReactNode[];
  /** Pixels per second. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  fadeEdges?: boolean;
  /** Gap between items in rem. */
  gap?: number;
}

/**
 * Pure-transform infinite marquee. Renders the strip twice for seamless loop.
 * GPU-only (transform), respects prefers-reduced-motion (animation removed by globals).
 */
export function Marquee({ items, speed = 60, reverse, className, fadeEdges = true, gap = 3 }: Props) {
  // Estimate width: rough heuristic, real duration computed at runtime by CSS keyframe.
  const duration = Math.max(20, items.length * (300 / speed));
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {fadeEdges && (
        <>
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
        </>
      )}
      <motion.div
        className="flex w-max"
        style={{ gap: `${gap}rem`, paddingRight: `${gap}rem` }}
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((it, i) => (
          <span key={i} className="shrink-0">{it}</span>
        ))}
      </motion.div>
    </div>
  );
}
