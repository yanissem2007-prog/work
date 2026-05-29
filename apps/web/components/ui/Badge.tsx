import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-2xs font-medium tracking-wide',
  {
    variants: {
      variant: {
        solid: 'bg-fg text-bg',
        soft: 'bg-surface-2 text-fg-soft',
        outline: 'border border-border text-fg-soft',
        accent: 'bg-accent/10 text-accent border border-accent/20',
        success: 'bg-success/10 text-success border border-success/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        danger: 'bg-danger/10 text-danger border border-danger/20',
        glass: 'glass text-fg'
      },
      dot: { true: '', false: '' }
    },
    defaultVariants: { variant: 'soft' }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dotColor?: string;
}

export function Badge({ className, variant, dot, dotColor, children, ...p }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...p}>
      {dot && (
        <span
          className="size-1.5 rounded-full animate-pulse-glow"
          style={{ background: dotColor ?? 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}
