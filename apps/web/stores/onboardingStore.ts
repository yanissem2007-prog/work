import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const ONBOARDING_TOTAL = 9;

export interface MissionState {
  profile: boolean; cv: boolean; community: boolean;
  firstPost: boolean; generateRoadmap: boolean; aiInteract: boolean;
}

interface OnboardingState {
  completed: boolean;
  open: boolean;
  step: number;
  xp: number;
  missions: MissionState;
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  start: () => void;
  skip: () => void;
  complete: () => void;
  reset: () => void;
  awardXp: (n: number) => void;
  completeMission: (k: keyof MissionState) => void;
}

const DEFAULT_MISSIONS: MissionState = {
  profile: false, cv: false, community: false, firstPost: false,
  generateRoadmap: false, aiInteract: false
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: false,
      open: false,
      step: 0,
      xp: 0,
      missions: DEFAULT_MISSIONS,
      setStep: (step) => set({ step }),
      next: () => {
        const s = get().step;
        if (s >= ONBOARDING_TOTAL - 1) get().complete();
        else { set({ step: s + 1 }); get().awardXp(25); }
      },
      prev: () => set({ step: Math.max(0, get().step - 1) }),
      start: () => set({ open: true, step: 0, completed: false, xp: 0, missions: DEFAULT_MISSIONS }),
      skip: () => set({ open: false, completed: true }),
      complete: () => set({ open: false, completed: true, xp: get().xp + 100 }),
      reset: () => set({ open: true, step: 0, completed: false, xp: 0, missions: DEFAULT_MISSIONS }),
      awardXp: (n) => set((s) => ({ xp: s.xp + n })),
      completeMission: (k) => set((s) => ({ missions: { ...s.missions, [k]: true } }))
    }),
    {
      name: 'work-onboarding',
      partialize: (s) => ({ completed: s.completed, xp: s.xp, missions: s.missions })
    }
  )
);
