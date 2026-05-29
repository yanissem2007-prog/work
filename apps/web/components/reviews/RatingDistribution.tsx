'use client';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Props { distribution: Record<number, number>; count: number }

export function RatingDistribution({ distribution, count }: Props) {
  const max = Math.max(1, ...Object.values(distribution));
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((stars) => {
        const v = distribution[stars] ?? 0;
        const pct = (v / max) * 100;
        const sharePct = count > 0 ? Math.round((v / count) * 100) : 0;
        return (
          <div key={stars} className="grid grid-cols-[44px_1fr_36px] items-center gap-2">
            <span className="text-xs flex items-center gap-1 tabular-nums text-muted">
              {stars} <Star size={10} className="fill-current text-warning" />
            </span>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: pct / 100 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full origin-left bg-grad-accent shadow-glow"
              />
            </div>
            <span className="text-2xs text-muted tabular-nums text-right">{sharePct}%</span>
          </div>
        );
      })}
    </div>
  );
}
