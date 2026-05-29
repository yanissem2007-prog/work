'use client';
import { forwardRef, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'relative isolate overflow-hidden transition-[transform,box-shadow,border-color] duration-normal ease-out-expo',
  {
    variants: {
      variant: {
        surface: 'bg-bg-elev border border-border shadow-sm',
        glass: 'glass',
        frost: 'glass-frost',
        outline: 'border border-border bg-transparent',
        gradient: 'bg-grad-mesh border border-border'
      },
      size: {
        sm: 'rounded-lg p-4',
        md: 'rounded-xl p-5',
        lg: 'rounded-2xl p-7',
        xl: 'rounded-2xl p-10'
      },
      interactive: {
        true: 'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
        false: ''
      }
    },
    defaultVariants: { variant: 'surface', size: 'md', interactive: false }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  tilt?: boolean;
  glow?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, tilt, glow, children, ...props }, ref) => {
    const inner = useRef<HTMLDivElement | null>(null);

    function onMove(e: React.MouseEvent<HTMLDivElement>) {
      const el = inner.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      if (tilt) {
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg)`;
      }
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    }
    function onLeave() {
      const el = inner.current; if (!el) return;
      if (tilt) el.style.transform = '';
    }

    return (
      <div
        ref={(node) => {
          inner.current = node;
          if (typeof ref === 'function') ref(node!);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn(cardVariants({ variant, size, interactive }), className)}
        {...props}
      >
        {glow && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-normal group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(400px circle at var(--mx,50%) var(--my,50%), oklch(72% 0.2 264 / 0.18), transparent 50%)'
            }}
          />
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...p} />;
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) =>
  <h3 className={cn('font-display text-xl tracking-snug', className)} {...p} />;
export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) =>
  <p className={cn('text-sm text-muted', className)} {...p} />;
export const CardFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('mt-5 flex items-center justify-between', className)} {...p} />;
