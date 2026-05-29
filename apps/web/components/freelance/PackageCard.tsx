'use client';
import { motion } from 'framer-motion';
import { Check, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Pkg {
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  description?: string;
  price: number;
  currency?: string;
  deliveryDays: number;
  revisions: number;
  features?: string[];
}

interface Props {
  pkg: Pkg;
  selected: boolean;
  onSelect: () => void;
  onBuy: () => void;
  busy?: boolean;
}

const TONE: Record<Pkg['tier'], string> = {
  basic: 'oklch(78% 0.18 200)',
  standard: 'oklch(72% 0.2 264)',
  premium: 'oklch(75% 0.22 50)'
};

export function PackageCard({ pkg, selected, onSelect, onBuy, busy }: Props) {
  const tone = TONE[pkg.tier];
  return (
    <motion.div
      layout
      onClick={onSelect}
      whileHover={{ y: -2 }}
      className={cn(
        'relative rounded-2xl border p-5 cursor-pointer transition-all',
        selected ? 'border-accent shadow-glow bg-bg-elev/80' : 'border-border bg-bg-elev/40 hover:border-border-strong'
      )}
    >
      {selected && (
        <motion.div
          layoutId="pkg-glow"
          className="absolute inset-0 -z-10 rounded-2xl blur-2xl opacity-40"
          style={{ background: `radial-gradient(circle, ${tone}, transparent 60%)` }}
        />
      )}
      <p className="text-2xs uppercase tracking-caps capitalize" style={{ color: tone }}>{pkg.tier}</p>
      <p className="mt-1 font-medium leading-tight">{pkg.title}</p>
      {pkg.description && <p className="mt-2 text-sm text-muted line-clamp-3">{pkg.description}</p>}

      <p className="mt-4 font-display text-3xl tracking-tightest tabular-nums">
        ${pkg.price}
        <span className="text-2xs text-muted ml-1 tracking-normal">{pkg.currency ?? 'USD'}</span>
      </p>

      <div className="mt-3 flex gap-3 text-2xs text-muted">
        <span className="flex items-center gap-1"><Clock size={11} /> {pkg.deliveryDays}d delivery</span>
        <span className="flex items-center gap-1"><RotateCcw size={11} /> {pkg.revisions} revisions</span>
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-xs">
          {pkg.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <Check size={11} className="mt-0.5 text-success shrink-0" /> {f}
            </li>
          ))}
        </ul>
      )}

      <Button
        variant={selected ? 'accent' : 'glass'} className="w-full mt-5"
        magnetic={selected} loading={busy && selected}
        onClick={(e) => { e.stopPropagation(); onBuy(); }}
      >
        Continue (${pkg.price})
      </Button>
    </motion.div>
  );
}
