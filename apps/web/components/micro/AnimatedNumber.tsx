'use client';
import { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';

interface Props {
  value: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Format function — defaults to integer with grouping. */
  format?: (n: number) => string;
  className?: string;
  /** Locale-aware grouping. */
  locale?: string;
  /** Decimal places for non-integers. */
  decimals?: number;
}

/**
 * Spring-eased number tween. Updates `display` via motion-value subscription so
 * animation runs outside React reconciliation.
 */
export function AnimatedNumber({
  value, duration = 1.2, format, decimals = 0, locale, className
}: Props) {
  const mv = useMotionValue(0);
  const [text, setText] = useState('0');

  useEffect(() => {
    const fmt =
      format ??
      ((n: number) => n.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }));
    const ctrl = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    const unsub = mv.on('change', (v) => setText(fmt(Number(v.toFixed(decimals)))));
    return () => { ctrl.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, decimals, locale]);

  return <span className={className}>{text}</span>;
}
