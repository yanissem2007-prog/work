'use client';
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Professional, restrained buttons: clean color/hover states, a visible focus
// ring, and a loading indicator. No magnetic pull, lift, scale or shine sweep.
const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-medium select-none whitespace-nowrap',
    'transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-out',
    'disabled:pointer-events-none disabled:opacity-40 ring-focus'
  ],
  {
    variants: {
      variant: {
        primary: 'bg-fg text-bg shadow-sm hover:opacity-90',
        accent: 'text-accent-fg bg-grad-accent shadow-sm hover:brightness-[1.04]',
        glass: 'glass text-fg hover:bg-surface-2/60',
        outline: 'border border-border-strong text-fg hover:bg-surface',
        ghost: 'text-fg hover:bg-surface',
        danger: 'bg-danger text-white hover:brightness-[1.04]',
        link: 'text-accent underline-offset-4 hover:underline'
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
  /** Kept for API compatibility — intentionally no-ops (no gadget animations). */
  magnetic?: boolean;
  shine?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, magnetic: _m, shine: _s, loading, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return <Slot ref={ref as never} className={classes} {...props}>{children}</Slot>;
    }

    return (
      <button ref={ref} disabled={loading || props.disabled} className={classes} {...props}>
        {loading && (
          <span className="inline-flex gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite]" />
            <span className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite] [animation-delay:0.15s]" />
            <span className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite] [animation-delay:0.3s]" />
          </span>
        )}
        <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
