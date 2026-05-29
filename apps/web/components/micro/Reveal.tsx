'use client';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Initial offset in px on the y axis. */
  y?: number;
  /** When to fire — defaults to once-on-enter with -50px margin. */
  once?: boolean;
}

const v: Variants = {
  hidden: (y: number) => ({ opacity: 0, y, filter: 'blur(8px)' }),
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};

export function Reveal({ children, className, delay = 0, y = 18, once = true }: Props) {
  return (
    <motion.div
      className={className}
      custom={y}
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-50px' }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export function Stagger({ children, className, stagger = 0.06 }: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
      }}
    >
      {children}
    </motion.div>
  );
}
