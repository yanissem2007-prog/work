'use client';
import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

export function OnboardingTrigger() {
  const { completed, open, start } = useOnboardingStore();
  useEffect(() => {
    if (!completed && !open) {
      // tiny delay so the shell renders first
      const t = setTimeout(() => start(), 400);
      return () => clearTimeout(t);
    }
  }, [completed, open, start]);
  return null;
}
