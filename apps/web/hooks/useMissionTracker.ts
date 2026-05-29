'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOnboardingStore, type MissionState } from '@/stores/onboardingStore';

const LABEL: Record<keyof MissionState, string> = {
  profile: 'Profile completed',
  cv: 'First CV built',
  community: 'Joined a community',
  firstPost: 'First post published',
  generateRoadmap: 'AI roadmap generated',
  aiInteract: 'Chatted with AI'
};

/**
 * Listens to global mutation success events from React Query and unlocks
 * onboarding missions when the matching server action lands.
 *
 * Conventions: any mutation whose meta has { mission: 'cv' } unlocks 'cv'.
 * Plus URL-pattern fallbacks for endpoints we don't own.
 */
export function useMissionTracker() {
  const qc = useQueryClient();
  const completeMission = useOnboardingStore((s) => s.completeMission);
  const awardXp = useOnboardingStore((s) => s.awardXp);
  const missions = useOnboardingStore((s) => s.missions);

  useEffect(() => {
    const cache = qc.getMutationCache();
    return cache.subscribe((evt) => {
      if (evt.type !== 'updated' || evt.mutation.state.status !== 'success') return;

      const url = (evt.mutation.options.mutationKey?.[0] as string) ?? '';
      const meta = evt.mutation.meta as { mission?: keyof MissionState } | undefined;

      let unlocked: keyof MissionState | null = meta?.mission ?? null;

      if (!unlocked) {
        if (/\/cv$/.test(url) || url === 'cv.create') unlocked = 'cv';
        else if (/\/posts$/.test(url) || url === 'post.create') unlocked = 'firstPost';
        else if (/\/communities\/.*\/join/.test(url)) unlocked = 'community';
        else if (/\/roadmap\/generate/.test(url)) unlocked = 'generateRoadmap';
        else if (/\/ai\/chat/.test(url)) unlocked = 'aiInteract';
        else if (/\/users\/me$/.test(url)) unlocked = 'profile';
      }

      if (!unlocked) return;
      if (missions[unlocked]) return; // already done

      completeMission(unlocked);
      awardXp(25);
      toast.success(`Mission unlocked — ${LABEL[unlocked]} · +25 XP`);
    });
  }, [qc, completeMission, awardXp, missions]);
}
