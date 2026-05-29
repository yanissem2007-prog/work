'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 25, stiffness: 250, mass: 0.3 });
  const sy = useSpring(y, { damping: 25, stiffness: 250, mass: 0.3 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHover(!!t.closest('a,button,[role=button],[data-cursor=hover]'));
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 mix-blend-difference hidden lg:block"
    >
      <motion.div
        animate={{ scale: hover ? 2.6 : 1, opacity: hover ? 0.85 : 0.6 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="size-3 rounded-full bg-white"
      />
    </motion.div>
  );
}
