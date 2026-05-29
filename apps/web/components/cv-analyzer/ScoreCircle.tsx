'use client';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  value: number;        // 0-100
  size?: number;
  label?: string;
}

export function ScoreCircle({ value, size = 220, label }: Props) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const progress = useMotionValue(0);
  const dash = useTransform(progress, (v) => c - (v / 100) * c);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(progress, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    const unsub = progress.on('change', (v) => setDisplay(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [value, progress]);

  const tier =
    value >= 85 ? { tone: 'oklch(78% 0.22 142)', label: 'Excellent' } :
    value >= 70 ? { tone: 'oklch(78% 0.18 200)', label: 'Strong' } :
    value >= 55 ? { tone: 'oklch(78% 0.18 70)', label: 'Solid' } :
    { tone: 'oklch(70% 0.22 25)', label: 'Needs work' };

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Glow halo */}
      <div className="absolute inset-0 rounded-full blur-3xl opacity-40 animate-pulse-glow"
        style={{ background: `radial-gradient(circle, ${tier.tone}, transparent 60%)` }} />

      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id="score-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor={tier.tone} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#score-grad)" strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c} style={{ strokeDashoffset: dash, filter: `drop-shadow(0 0 8px ${tier.tone})` }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-5xl tracking-tightest tabular-nums">{display}</p>
          <p className="text-2xs uppercase tracking-caps mt-1" style={{ color: tier.tone }}>
            {label ?? tier.label}
          </p>
        </div>
      </div>
    </div>
  );
}
