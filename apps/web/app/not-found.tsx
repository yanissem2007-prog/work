import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-60" />
      <div className="absolute inset-0 -z-10 noise" />
      <div className="text-center">
        <p className="text-eyebrow mb-3">404</p>
        <h1 className="font-display text-6xl md:text-8xl tracking-tightest leading-none">
          Lost in <span className="gradient-text italic">space</span>.
        </h1>
        <p className="mt-4 text-muted">That page doesn't exist — yet.</p>
        <Link href="/" className="inline-block mt-8">
          <Button variant="accent" size="lg" magnetic>
            Take me home <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </main>
  );
}
