'use client';
import { useEffect, useState } from 'react';
import { useMotionValue, animate } from 'framer-motion';

export function useAnimatedCounter(target: number, durationSec = 0.9): number {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(mv, target, { duration: durationSec, ease: [0.16, 1, 0.3, 1] });
    const unsub = mv.on('change', (v) => setDisplay(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return display;
}
