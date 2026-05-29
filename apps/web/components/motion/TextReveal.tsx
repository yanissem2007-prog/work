'use client';
import { motion } from 'framer-motion';

export function TextReveal({
  text, className, delay = 0
}: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline mr-[0.25em]">
          <motion.span
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.9, delay: delay + i * 0.05,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="inline-block"
          >{w}</motion.span>
        </span>
      ))}
    </span>
  );
}
