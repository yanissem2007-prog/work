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

const SESSION_HINT = 'work_auth';

/**
 * Mirror a session flag onto the web origin so the Next middleware can gate
 * routes. In production the API's real `work_rt` cookie is set on a different
 * domain and is unreadable from here. This flag holds no secret and grants no
 * access — every API call is still authorized by the bearer token server-side.
 */
function syncSessionHint(hasSession: boolean): void {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = hasSession
    ? `${SESSION_HINT}=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax${secure}`
    : `${SESSION_HINT}=; path=/; max-age=0; samesite=lax${secure}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        syncSessionHint(!!accessToken);
        set({ accessToken });
      },
      logout: () => {
        syncSessionHint(false);
        set({ user: null, accessToken: null });
      }
    }),
    {
      name: 'work-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      // Re-arm the hint after a reload: the store is restored from localStorage,
      // but the cookie may have expired independently.
      onRehydrateStorage: () => (state) => syncSessionHint(!!state?.accessToken)
    }
  )
);
