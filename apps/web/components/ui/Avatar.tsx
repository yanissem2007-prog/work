import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'idle' | 'offline';
  ring?: boolean;
  className?: string;
}

const sizes = {
  xs: 'size-6 text-2xs',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-lg'
};

const statusColors = {
  online: 'bg-success',
  idle: 'bg-warning',
  offline: 'bg-muted'
};

export function Avatar({ src, name, size = 'md', status, ring, className }: AvatarProps) {
  const initials = (name ?? '?')
    .split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={cn('relative inline-block', className)}>
      <div className={cn(
        'rounded-full overflow-hidden grid place-items-center font-medium',
        'bg-grad-accent text-accent-fg',
        ring && 'ring-2 ring-bg shadow-md',
        sizes[size]
      )}>
        {src
          ? <img src={src} alt={name ?? ''} className="size-full object-cover" />
          : <span>{initials}</span>}
      </div>
      {status && (
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-bg',
          statusColors[status]
        )} />
      )}
    </div>
  );
}
