'use client';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Edge color. Defaults to accent. */
  color?: string;
}

/**
 * Conic-gradient edge that rotates around the element — Awwwards-style "energy ring".
 */
export function GlowEdge({ children, className, color = 'var(--accent)' }: Props) {
  return (
    <div className={cn('relative rounded-[inherit]', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-70 animate-[spin_8s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, ${color}, transparent 25%, ${color} 50%, transparent 75%, ${color})`,
          maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1.5px'
        }}
      />
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
