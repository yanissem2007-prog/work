'use client';
import { useEffect, useState } from 'react';

export interface Countdown {
  days: number; hours: number; minutes: number; seconds: number;
  totalMs: number; status: 'upcoming' | 'live' | 'past';
}

export function useCountdown(target: string | Date | undefined, endsAt?: string | Date): Countdown {
  const compute = (): Countdown => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, status: 'past' };
    const now = Date.now();
    const start = new Date(target).getTime();
    const end = endsAt ? new Date(endsAt).getTime() : start;
    let status: Countdown['status'] = 'upcoming';
    let totalMs = start - now;
    if (now >= start && now <= end) { status = 'live'; totalMs = end - now; }
    else if (now > end) { status = 'past'; totalMs = 0; }
    const abs = Math.max(0, totalMs);
    const days = Math.floor(abs / 86_400_000);
    const hours = Math.floor((abs % 86_400_000) / 3_600_000);
    const minutes = Math.floor((abs % 3_600_000) / 60_000);
    const seconds = Math.floor((abs % 60_000) / 1_000);
    return { days, hours, minutes, seconds, totalMs, status };
  };

  const [c, setC] = useState<Countdown>(compute);
  useEffect(() => {
    setC(compute());
    const id = setInterval(() => setC(compute()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, endsAt]);
  return c;
}
