'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Intro() {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('work-intro')) { setDone(true); return; }
    const start = performance.now();
    const duration = 2400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        sessionStorage.setItem('work-intro', '1');
        setTimeout(() => setDone(true), 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] grid place-items-center bg-bg overflow-hidden"
        >
          {/* Aurora wash */}
          <motion.div
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 mesh aurora animate-aurora"
          />

          {/* Center mark */}
          <div className="relative flex flex-col items-center gap-8">
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="size-20 rounded-2xl bg-grad-accent shadow-glow"
            />

            {/* Wordmark — letters flip up netflix-style */}
            <div className="flex gap-0 overflow-hidden">
              {'WORK'.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: '105%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block font-display text-6xl md:text-8xl tracking-tightest"
                >
                  {ch}
                </motion.span>
              ))}
            </div>

            {/* Progress */}
            <div className="w-48 h-px bg-border overflow-hidden">
              <motion.div
                className="h-full bg-grad-accent origin-left"
                style={{ scaleX: progress }}
              />
            </div>
            <p className="text-2xs tracking-caps uppercase text-muted">
              Loading the future of work · {Math.floor(progress * 100)}%
            </p>
          </div>

          {/* Curtain reveal */}
          <motion.div
            initial={{ scaleY: 1 }}
            animate={done ? { scaleY: 0 } : { scaleY: 1 }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-x-0 bottom-0 origin-bottom bg-bg pointer-events-none"
            style={{ height: '100%' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
