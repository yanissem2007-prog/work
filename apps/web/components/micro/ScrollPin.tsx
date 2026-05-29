'use client';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Length of the pinned section in viewport heights. */
  vh?: number;
}

/**
 * GSAP-style pinned scroll section using sticky + IntersectionObserver progress.
 * Children receive a CSS variable --p (0..1) representing progress through the pin.
 *
 * Usage:
 *   <ScrollPin vh={3}>
 *     <div className="h-screen grid place-items-center">
 *       <h2 style={{ opacity: 'calc(1 - var(--p))' }}>Cinematic title</h2>
 *     </div>
 *   </ScrollPin>
 */
export function ScrollPin({ children, className, vh = 3 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const total = wrap.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const p = total > 0 ? scrolled / total : 0;
        inner.style.setProperty('--p', String(p.toFixed(4)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div ref={wrapRef} className={cn('relative', className)} style={{ height: `${vh * 100}vh` }}>
      <div ref={innerRef} className="sticky top-0 h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
