'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Top-of-screen gradient progress bar fired on route change.
 * Trickles for ~600ms, then snaps to 100% and fades.
 */
export function RouteProgress() {
  const path = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let id: NodeJS.Timeout;
    setVisible(true); setProgress(0);
    id = setTimeout(() => setProgress(0.7), 50);
    const done = setTimeout(() => {
      setProgress(1);
      setTimeout(() => setVisible(false), 200);
    }, 600);
    return () => { clearTimeout(id); clearTimeout(done); };
  }, [path]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[400] h-0.5 bg-grad-accent shadow-glow origin-left"
          style={{ scaleX: progress, transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      )}
    </AnimatePresence>
  );
}
