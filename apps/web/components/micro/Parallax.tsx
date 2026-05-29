'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Range in px the layer travels as the element scrolls through the viewport. */
  range?: number;
}

/** GPU-only Y-translation tied to scroll position. */
export function Parallax({ children, className, range = 80 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
  return (
    <motion.div ref={ref} style={{ y }} className={cn('will-change-transform', className)}>
      {children}
    </motion.div>
  );
}
