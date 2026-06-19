'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Briefcase, MessageSquare, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCK = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/ai', label: 'AI', icon: Sparkles, hero: true },
  { href: '/messages', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Me', icon: User }
];

export function MobileDock() {
  const path = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-[50] glass-strong rounded-2xl px-2 py-1.5 flex items-center justify-around">
      {DOCK.map(({ href, label, icon: Icon, hero }) => {
        const active = path?.startsWith(href);
        if (hero) {
          return (
            <Link key={href} href={href}
              className="relative -mt-7 size-14 rounded-2xl bg-grad-accent shadow-glow grid place-items-center text-accent-fg animate-pulse-glow">
              <Icon size={22} />
            </Link>
          );
        }
        return (
          <Link key={href} href={href}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-2xs rounded-xl transition',
              active ? 'text-fg' : 'text-muted'
            )}>
            {active && (
              <motion.span layoutId="dock-active"
                className="absolute inset-0 rounded-xl bg-surface-2"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <Icon size={18} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
