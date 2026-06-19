'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useSearchStore } from '@/stores/searchStore';
import { useAuthStore } from '@/stores/authStore';

// Immersive, full-viewport routes own the whole screen (chat, channel, editor)
// and provide their own headers — the Topbar would only get in the way there.
function isImmersive(path: string | null): boolean {
  if (!path) return false;
  return (
    path === '/ai' ||
    path === '/messages' ||
    /^\/communities\/[^/]+/.test(path) ||
    /^\/cv-builder\/[^/]+/.test(path)
  );
}

/**
 * Sticky utility bar at the top of the app column. On desktop it complements
 * the sidebar with search / notifications / theme / profile. On mobile (where
 * the sidebar is hidden) it is the ONLY way to reach those — closing a real gap.
 */
export function Topbar() {
  const openSearch = useSearchStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const path = usePathname();

  if (isImmersive(path)) return null;

  return (
    <header
      className="sticky top-0 z-30 -mt-6 -mx-4 sm:-mx-6 mb-4 h-14 px-4 sm:px-6
                 flex items-center gap-2 glass-frost border-b border-border"
    >
      <Link
        href="/home"
        aria-label="WORK home"
        className="lg:hidden mr-1 inline-flex items-center"
      >
        <span className="inline-block size-7 rounded-lg bg-grad-accent shadow-glow" />
      </Link>

      <button
        onClick={openSearch}
        aria-label="Open search"
        className="group flex-1 max-w-md inline-flex items-center gap-2 h-9 px-3 rounded-pill
                   border border-border bg-surface/60 text-muted text-left
                   hover:text-fg hover:border-border-strong transition-colors"
      >
        <Search size={15} className="shrink-0" />
        <span className="text-sm truncate">Search people, jobs, communities…</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center text-[10px] font-mono text-muted-2 border border-border rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsDropdown />
        <Link href="/profile" aria-label="Your profile" className="ml-0.5 inline-flex">
          <Avatar src={user?.avatar} name={user?.name ?? 'You'} size="sm" ring />
        </Link>
      </div>
    </header>
  );
}
