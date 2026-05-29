'use client';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/**
 * Button with a "liquid" gradient blob that follows the cursor while hovered,
 * plus a ripple on click. Pure CSS — no Framer dependency at the cost.
 */
export function LiquidButton({ children, className, onClick, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  function onPress(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(r.width, r.height);
      Object.assign(ripple.style, {
        position: 'absolute', left: `${e.clientX - r.left - size / 2}px`,
        top: `${e.clientY - r.top - size / 2}px`,
        width: `${size}px`, height: `${size}px`,
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.35)',
        transform: 'scale(0)', opacity: '1',
        transition: 'transform 700ms cubic-bezier(0.16,1,0.3,1), opacity 700ms',
        pointerEvents: 'none', mixBlendMode: 'overlay'
      });
      el.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(2)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => ripple.remove(), 750);
    }
    onClick?.(e);
  }

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onClick={onPress}
      className={cn(
        'group relative isolate inline-flex items-center justify-center gap-2 px-6 py-3 rounded-pill overflow-hidden',
        'font-medium text-accent-fg transition-transform duration-fast hover:-translate-y-0.5 active:translate-y-0',
        'bg-grad-accent shadow-glow',
        className
      )}
      {...rest}
    >
      {/* Liquid blob */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-normal"
        style={{
          background:
            'radial-gradient(120px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.45), transparent 60%)',
          mixBlendMode: 'overlay'
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
