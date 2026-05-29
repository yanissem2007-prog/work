'use client';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const Ctx = createContext<Socket | null>(null);
export const useSocket = () => useContext(Ctx);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const socket = useMemo(() => {
    if (!token) return null;
    return io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false
    });
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.connect();
    return () => { socket.disconnect(); };
  }, [socket]);

  return <Ctx.Provider value={socket}>{children}</Ctx.Provider>;
}
