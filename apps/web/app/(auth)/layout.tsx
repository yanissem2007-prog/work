import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh aurora animate-aurora opacity-70" />
      <div className="pointer-events-none fixed inset-0 -z-10 noise" />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg">
          <span className="inline-block size-6 rounded-md bg-grad-accent shadow-glow" />
          WORK
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative grid place-items-center min-h-dvh px-4 py-20">
        {children}
      </main>
    </div>
  );
}
