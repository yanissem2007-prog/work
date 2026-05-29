import { create } from 'zustand';

interface SearchState {
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open })
}));
