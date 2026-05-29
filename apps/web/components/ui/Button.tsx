'use client';
import { forwardRef, useRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'group relative inline-flex items-center justify-center gap-2',
    'font-medium select-none whitespace-nowrap isolate',
    'transition-[transform,background,color,box-shadow,border-color] duration-normal ease-out-expo',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
    'ring-focus overflow-hidden'
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-fg text-bg shadow-md hover:shadow-lg hover:-translate-y-0.5',
        accent:
          'text-accent-fg bg-grad-accent shadow-glow hover:brightness-110 hover:-translate-y-0.5',
        glass:
          'glass text-fg hover:bg-surface-2/60',
        outline:
          'border border-border-strong text-fg hover:bg-surface',
        ghost:
          'text-fg hover:bg-surface',
        danger:
          'bg-danger text-white hover:brightness-110',
        link:
          'text-accent underline-offset-4 hover:underline'
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-9 px-3.5 text-sm rounded-lg',
        md: 'h-11 px-5 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-base rounded-2xl',
        icon: 'h-10 w-10 rounded-xl',
        pill: 'h-11 px-6 text-sm rounded-pill'
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  magnetic?: boolean;
  loading?: boolean;
  shine?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, magnetic, loading, shine = true, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const innerRef = useRef<HTMLButtonElement | null>(null);

    function onMove(e: React.MouseEvent<HTMLButtonElement>) {
      if (!magnetic) return;
      const el = innerRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
    }
    function onLeave() {
      if (!magnetic) return;
      const el = innerRef.current; if (!el) return;
      el.style.transform = '';
    }

    return (
      <Comp
        ref={(node) => {
          innerRef.current = node as HTMLButtonElement;
          if (typeof ref === 'function') ref(node as HTMLButtonElement);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node as HTMLButtonElement;
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        disabled={loading || props.disabled}
        className={cn(buttonVariants({ variant, size }), shine && 'shine', className)}
        {...props}
      >
        {loading && (
          <span className="inline-flex gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite]" />
            <span className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite] [animation-delay:0.15s]" />
            <span className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite] [animation-delay:0.3s]" />
          </span>
        )}
        <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
          {children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
