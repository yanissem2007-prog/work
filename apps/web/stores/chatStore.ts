import { create } from 'zustand';

interface ChatState {
  typing: Record<string, Set<string>>; // roomId -> userIds
  online: Set<string>;
  setTyping: (roomId: string, userId: string, typing: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  typing: {},
  online: new Set(),
  setTyping: (roomId, userId, typing) =>
    set((s) => {
      const next = new Set(s.typing[roomId] ?? []);
      if (typing) next.add(userId); else next.delete(userId);
      return { typing: { ...s.typing, [roomId]: next } };
    }),
  setOnline: (userId, online) =>
    set((s) => {
      const next = new Set(s.online);
      if (online) next.add(userId); else next.delete(userId);
      return { online: next };
    })
}));
