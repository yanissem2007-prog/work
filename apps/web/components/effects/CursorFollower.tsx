'use client';
import { useEffect, useRef } from 'react';

/**
 * Mix-blend-difference cursor halo with spring-eased follow.
 * Hides on touch devices and respects prefers-reduced-motion.
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;
    let hover = false;

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      hover = !!t.closest('a, button, [data-cursor="hover"]');
    };

    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0) scale(${hover ? 1.6 : 1})`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onEnter, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onEnter);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[300] mix-blend-difference hidden md:block" aria-hidden>
      <div ref={dotRef} className="absolute size-1.5 rounded-full bg-white" />
      <div ref={ringRef}
        className="absolute size-8 rounded-full border border-white/70 transition-[transform] duration-200 ease-out will-change-transform" />
    </div>
  );
}
