'use client';
import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees on each axis. */
  max?: number;
  /** Show a soft inner highlight that tracks the cursor. */
  glare?: boolean;
}

/**
 * GPU-accelerated 3D tilt on hover. Respects prefers-reduced-motion.
 * No-ops on touch devices to avoid orientation jitter.
 */
export function TiltCard({ children, className, max = 8, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);   // -1..1
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.5 });
  const rotateY = useTransform(sx, (v) => v * max);
  const rotateX = useTransform(sy, (v) => -v * max);
  const gx = useTransform(sx, (v) => `${50 + v * 35}%`);
  const gy = useTransform(sy, (v) => `${50 + v * 35}%`);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window === 'undefined') return;
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    px.set(x * 2 - 1);
    py.set(y * 2 - 1);
  }
  function reset() { px.set(0); py.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ transformStyle: 'preserve-3d', rotateX, rotateY, perspective: 1000 }}
      className={cn('relative will-change-transform', className)}
    >
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-overlay"
          style={{
            background: 'radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.35), transparent 50%)',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            '--gx': gx as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            '--gy': gy as any,
            opacity: useTransform([sx, sy], ([x, y]) => Math.min(0.9, Math.hypot(x as number, y as number)))
          } as any}
        />
      )}
      {children}
    </motion.div>
  );
}
