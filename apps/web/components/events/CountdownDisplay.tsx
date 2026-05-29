'use client';
import { motion } from 'framer-motion';
import { useCountdown } from '@/hooks/useCountdown';

interface Props { startsAt: string; endsAt?: string; size?: 'sm' | 'md' | 'lg' }

export function CountdownDisplay({ startsAt, endsAt, size = 'md' }: Props) {
  const c = useCountdown(startsAt, endsAt);

  if (c.status === 'past') {
    return <span className="text-2xs uppercase tracking-caps text-muted">Ended</span>;
  }
  if (c.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps text-danger">
        <span className="size-2 rounded-full bg-danger animate-pulse" /> Live now
      </span>
    );
  }

  const cells = [
    { label: 'days', value: c.days },
    { label: 'hrs', value: c.hours },
    { label: 'min', value: c.minutes },
    { label: 'sec', value: c.seconds }
  ];

  const sizeClasses = {
    sm: 'text-base px-1.5 py-1',
    md: 'text-2xl px-3 py-2',
    lg: 'text-4xl px-4 py-3'
  }[size];

  return (
    <div className="inline-flex gap-2">
      {cells.map((cell) => (
        <div key={cell.label} className="glass rounded-xl text-center min-w-[3.5rem]">
          <motion.div
            key={`${cell.label}-${cell.value}`}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`font-display tracking-tightest tabular-nums ${sizeClasses}`}
          >
            {String(cell.value).padStart(2, '0')}
          </motion.div>
          <p className="text-[10px] uppercase tracking-caps text-muted pb-1">{cell.label}</p>
        </div>
      ))}
    </div>
  );
}
