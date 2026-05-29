import { cn } from '@/lib/utils';

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size}
      className={cn('animate-[spin-slow_0.8s_linear_infinite]', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" fill="none" strokeDasharray="40 60" opacity="0.9" />
    </svg>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex gap-1', className)}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i}
          className="size-1.5 rounded-full bg-current animate-[dot-bounce_1.2s_infinite]"
          style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}
