'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function FloatingCard({
  children, className, delay = 0
}: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
