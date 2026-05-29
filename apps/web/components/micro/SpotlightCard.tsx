'use client';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Spotlight color. Defaults to accent. */
  color?: string;
  /** Radius in pixels. */
  radius?: number;
}

/**
 * Cursor-following radial spotlight. Uses CSS variables on a single overlay,
 * so the spotlight tracks via a cheap style write — no React re-renders.
 */
export function SpotlightCard({ children, className, color = 'var(--accent)', radius = 220 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
    el.style.setProperty('--mo', '1');
  }
  function reset() { ref.current?.style.setProperty('--mo', '0'); }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn('relative isolate overflow-hidden', className)}
      style={{
        // @ts-expect-error css var
        '--r': `${radius}px`
      }}
    >
      {/* Spotlight overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-normal"
        style={{
          background: `radial-gradient(var(--r) circle at var(--mx, -100px) var(--my, -100px), color-mix(in oklch, ${color} 35%, transparent), transparent 60%)`,
          opacity: 'var(--mo, 0)'
        }}
      />
      {children}
    </div>
  );
}
