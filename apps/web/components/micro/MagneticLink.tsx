'use client';
import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Strength of the pull effect — pixels per cursor distance. */
  strength?: number;
}

/**
 * Generic magnetic wrapper: children get pulled toward the cursor. Works on
 * buttons, links, icons. No-ops on touch + reduced motion.
 */
export function MagneticLink({ children, className, strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 350, damping: 22 });
  const sy = useSpring(y, { stiffness: 350, damping: 22 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window === 'undefined') return;
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  }
  function reset() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn('inline-flex will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}
