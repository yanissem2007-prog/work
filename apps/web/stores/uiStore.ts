import { create } from 'zustand';

interface UIState {
  cmdkOpen: boolean;
  setCmdk: (v: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  cmdkOpen: false,
  setCmdk: (cmdkOpen) => set({ cmdkOpen }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
}));
