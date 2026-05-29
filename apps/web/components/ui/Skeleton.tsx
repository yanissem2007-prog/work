import { cn } from '@/lib/utils';

export function Skeleton({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-2',
        'before:absolute before:inset-0 before:animate-shimmer',
        'before:bg-[linear-gradient(90deg,transparent,oklch(100%_0_0_/_0.08),transparent)]',
        'before:bg-[length:200%_100%]',
        className
      )}
      {...p}
    />
  );
}
