'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSocket } from '@/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Subscribes to xp:awarded + notif:push (gamification kind) and shows
 * premium toasts. Mounted globally in AppShell.
 */
export function XpToaster() {
  const socket = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const onXp = (p: { type: string; xp: number; level: number; totalXp: number }) => {
      toast(`+${p.xp} XP`, {
        description: p.type.replaceAll('.', ' · '),
        duration: 2000
      });
      qc.invalidateQueries({ queryKey: ['gamification', 'me'] });
    };
    const onNotif = (p: any) => {
      if (p?.kind !== 'gamification') return;
      if (p.event === 'level-up') {
        toast.success(`🎉 Level up — Lvl ${p.level}`, { duration: 4500 });
      } else if (p.event === 'badge' && p.badge) {
        toast.success(`🏆 Badge unlocked — ${p.badge.name}`, {
          description: p.badge.description,
          duration: 5000
        });
      }
      qc.invalidateQueries({ queryKey: ['gamification', 'me'] });
    };
    socket.on('xp:awarded', onXp);
    socket.on('notif:push', onNotif);
    return () => {
      socket.off('xp:awarded', onXp);
      socket.off('notif:push', onNotif);
    };
  }, [socket, qc]);

  return null;
}
