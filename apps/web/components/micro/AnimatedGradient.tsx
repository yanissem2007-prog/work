'use client';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  /** Lower = denser glow blobs. */
  opacity?: number;
}

/**
 * Mesh of slow-drifting radial gradient blobs. Pure CSS, no JS animation.
 * Use as a `-z-10 absolute inset-0` background layer.
 */
export function AnimatedGradient({ className, opacity = 0.55 }: Props) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ opacity }}>
      <span className="absolute -top-1/3 -left-1/3 size-[60vmax] rounded-full blur-3xl animate-[drift1_22s_linear_infinite]"
        style={{ background: 'radial-gradient(circle, oklch(70% 0.24 264 / 0.55), transparent 60%)' }} />
      <span className="absolute -bottom-1/3 right-0 size-[55vmax] rounded-full blur-3xl animate-[drift2_28s_linear_infinite]"
        style={{ background: 'radial-gradient(circle, oklch(70% 0.24 340 / 0.45), transparent 60%)' }} />
      <span className="absolute top-1/3 right-1/4 size-[45vmax] rounded-full blur-3xl animate-[drift3_34s_linear_infinite]"
        style={{ background: 'radial-gradient(circle, oklch(78% 0.18 200 / 0.4), transparent 60%)' }} />

      <style jsx>{`
        @keyframes drift1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(10vw, 6vh); } }
        @keyframes drift2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-8vw, -10vh); } }
        @keyframes drift3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-6vw, 4vh); } }
      `}</style>
    </div>
  );
}
