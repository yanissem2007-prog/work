'use client';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
            {children}
            <CommandPalette />
            <Toaster theme="system" richColors position="bottom-right" />
          </SocketProvider>
        </LenisProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
