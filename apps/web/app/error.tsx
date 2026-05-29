'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Surface to monitoring later
      console.error(error);
    }
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="text-center max-w-md">
        <p className="text-eyebrow mb-3">Error</p>
        <h1 className="font-display text-4xl tracking-tighter">Something broke.</h1>
        <p className="mt-2 text-muted text-sm">A wire snapped on our end. Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="accent" magnetic onClick={reset}><RotateCcw size={14} /> Try again</Button>
          <Button asChild variant="glass"><Link href="/"><Home size={14} /> Home</Link></Button>
        </div>
      </div>
    </main>
  );
}
