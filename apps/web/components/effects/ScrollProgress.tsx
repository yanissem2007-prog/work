'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

/** Cinematic bottom-of-screen scroll progress bar — fixed, gradient, GPU-only. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed bottom-0 inset-x-0 z-[350] h-0.5 bg-grad-accent origin-left shadow-glow"
      style={{ scaleX }}
    />
  );
}
