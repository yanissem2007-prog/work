import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@work/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (u: User | null) => void;
  setAccessToken: (t: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null })
    }),
    { name: 'work-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken }) }
  )
);
