'use client';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { useState } from 'react';
import { LenisProvider } from './LenisProvider';
import { SocketProvider } from './SocketProvider';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } }
  }));
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={qc}>
        <LenisProvider>
          <SocketProvider>
            {/* Honor the OS "reduce motion" setting across every Framer animation. */}
            <MotionConfig reducedMotion="user">
              {children}
              <CommandPalette />
              <Toaster theme="system" richColors position="bottom-right" />
            </MotionConfig>
          </SocketProvider>
        </LenisProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
