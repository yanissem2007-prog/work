'use client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({ value, size = 14, interactive, onChange }:
  { value: number; size?: number; interactive?: boolean; onChange?: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={cn(
            'transition',
            interactive && 'hover:scale-110 cursor-pointer',
            !interactive && 'cursor-default'
          )}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={cn(n <= value ? 'fill-current text-warning' : 'text-muted')}
          />
        </button>
      ))}
    </div>
  );
}
