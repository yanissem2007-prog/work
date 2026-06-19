'use client';
import { forwardRef, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputBase = cva(
  [
    'peer w-full bg-transparent text-fg placeholder:text-muted/70',
    'outline-none transition-all duration-normal ease-out-expo',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ],
  {
    variants: {
      size: {
        sm: 'h-9 text-sm',
        md: 'h-11 text-sm',
        lg: 'h-13 text-base'
      }
    },
    defaultVariants: { size: 'md' }
  }
);

const wrapVariants = cva(
  [
    'group relative flex items-center gap-2 px-3.5',
    'border bg-surface rounded-xl',
    'transition-all duration-normal ease-out-expo',
    'focus-within:border-accent focus-within:shadow-glow',
    'has-[:disabled]:opacity-60'
  ],
  {
    variants: {
      variant: {
        surface: 'border-border bg-surface',
        glass: 'glass border-transparent',
        outline: 'bg-transparent border-border-strong'
      },
      invalid: { true: 'border-danger focus-within:border-danger focus-within:shadow-none ring-1 ring-danger/40', false: '' }
    },
    defaultVariants: { variant: 'surface', invalid: false }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>,
    VariantProps<typeof inputBase>,
    VariantProps<typeof wrapVariants> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leading, trailing, className, size, variant, id, ...props }, ref) => {
    const uid = useId();
    const inputId = id ?? uid;
    const invalid = !!error;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-fg-soft tracking-snug">
            {label}
          </label>
        )}
        <div className={cn(wrapVariants({ variant, invalid }))}>
          {leading && <span className="text-muted shrink-0">{leading}</span>}
          <input ref={ref} id={inputId} aria-invalid={invalid}
            className={cn(inputBase({ size }), className)} {...props} />
          {trailing && <span className="text-muted shrink-0">{trailing}</span>}
        </div>
        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>{error ?? hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* Floating label variant — premium */
export const FloatingInput = forwardRef<HTMLInputElement, InputProps>(
  // Strip non-native props (hint/leading/trailing/size/variant/invalid) so they
  // are never spread onto the underlying <input>.
  ({ label, error, className, id, hint, leading, trailing, size, variant, invalid, ...props }, ref) => {
    const uid = useId();
    const inputId = id ?? uid;
    const [val, setVal] = useState('');
    return (
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          value={props.value ?? val}
          onChange={(e) => { setVal(e.target.value); props.onChange?.(e); }}
          placeholder=" "
          className={cn(
            'peer h-14 w-full rounded-xl bg-surface border border-border px-4 pt-5 pb-1.5',
            'text-sm text-fg outline-none transition-all duration-normal',
            'focus:border-accent focus:shadow-glow',
            error && 'border-danger',
            className
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm',
            'transition-all duration-normal ease-out-expo',
            'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-2xs peer-focus:text-accent peer-focus:tracking-caps peer-focus:uppercase',
            'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-2xs peer-[:not(:placeholder-shown)]:tracking-caps peer-[:not(:placeholder-shown)]:uppercase'
          )}
        >{label}</label>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
FloatingInput.displayName = 'FloatingInput';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...p }, ref) => {
    const uid = useId();
    const taId = id ?? uid;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={taId} className="text-xs font-medium text-fg-soft tracking-snug">{label}</label>
        )}
        <textarea ref={ref} id={taId} aria-invalid={!!error}
          className={cn(
            'w-full min-h-24 rounded-xl bg-surface border px-4 py-3',
            'text-sm text-fg outline-none transition-all duration-normal resize-y',
            'focus:border-accent focus:shadow-glow',
            error ? 'border-danger' : 'border-border',
            className
          )} {...p} />
        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>{error ?? hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
