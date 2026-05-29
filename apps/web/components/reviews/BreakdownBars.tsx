'use client';
import { motion } from 'framer-motion';
import { Stars } from '@/components/freelance/Stars';

interface Props {
  breakdown: { culture: number; comp: number; worklife: number; management: number; growth: number };
}

const ROWS = [
  { key: 'culture',    label: 'Culture & values' },
  { key: 'worklife',   label: 'Work-life balance' },
  { key: 'comp',       label: 'Compensation' },
  { key: 'management', label: 'Management' },
  { key: 'growth',     label: 'Career growth' }
] as const;

export function BreakdownBars({ breakdown }: Props) {
  return (
    <div className="space-y-3">
      {ROWS.map((r, i) => {
        const v = breakdown[r.key] ?? 0;
        const pct = (v / 5) * 100;
        const tone = v >= 4 ? 'oklch(78% 0.22 142)' : v >= 3 ? 'oklch(78% 0.18 200)' : 'oklch(78% 0.18 70)';
        return (
          <motion.div key={r.key}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.5 }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm">{r.label}</p>
              <div className="flex items-center gap-2">
                <Stars value={Math.round(v)} size={11} />
                <span className="text-xs tabular-nums font-medium" style={{ color: tone }}>{v.toFixed(1)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: pct / 100 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full origin-left"
                style={{
                  background: `linear-gradient(90deg, var(--accent), ${tone})`,
                  boxShadow: `0 0 6px ${tone}`
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
