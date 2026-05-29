'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'span' | 'h1' | 'h2' | 'p';
}

export function Reveal({
  children, delay = 0, y = 28, blur = 8,
  duration = 0.9, once = true, className, as = 'div'
}: RevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-10% 0px' });
  const Comp = motion[as];
  return (
    <Comp
      ref={ref}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >{children}</Comp>
  );
}

export function Stagger({ children, className, delay = 0.08 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-10%' }}
      variants={{ visible: { transition: { staggerChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 20 }: { children: React.ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: 'blur(6px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
      }}
    >{children}</motion.div>
  );
}
