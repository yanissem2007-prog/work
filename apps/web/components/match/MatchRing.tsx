'use client';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  value: number;
  size?: number;
  stroke?: number;
}

export function MatchRing({ value, size = 88, stroke = 8 }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = useMotionValue(0);
  const dash = useTransform(progress, (v) => c - (v / 100) * c);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const ctrl = animate(progress, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    const unsub = progress.on('change', (v) => setDisplay(Math.round(v)));
    return () => { ctrl.stop(); unsub(); };
  }, [value, progress]);

  const tone =
    value >= 85 ? 'oklch(78% 0.22 142)' :
    value >= 70 ? 'oklch(78% 0.18 200)' :
    value >= 55 ? 'oklch(78% 0.18 70)' :
                  'oklch(70% 0.22 25)';

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse-glow"
        style={{ background: `radial-gradient(circle, ${tone}, transparent 60%)` }} />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={`mg-${size}`} x1="0" x2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor={tone} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#mg-${size})`} strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c}
          style={{ strokeDashoffset: dash, filter: `drop-shadow(0 0 6px ${tone})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display tracking-tightest tabular-nums"
          style={{ color: tone, fontSize: size * 0.32 }}>
          {display}
          <span className="text-muted text-[0.5em] align-top ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
}
