'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsDropdown } from './NotificationsDropdown';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useSearchStore } from '@/stores/searchStore';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/communities', label: 'Communities' },
  { href: '/ai', label: 'AI' }
];

export function TopNav() {
  const openSearch = useSearchStore((s) => s.toggle);
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ['oklch(0% 0 0 / 0)', 'var(--glass-bg)']);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      style={{ background: bg }}
      className={cn(
        'fixed top-0 inset-x-0 z-[40] transition-all duration-normal',
        scrolled ? 'backdrop-blur-md saturate-150 border-b border-border/60' : 'border-b border-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight">
          <span className="inline-block size-6 rounded-md bg-grad-accent shadow-glow" />
          WORK
        </Link>
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className="relative px-3 py-1.5 text-sm text-muted hover:text-fg transition rounded-pill hover:bg-surface">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" aria-label="Search" onClick={openSearch}><Search size={18} /></Button>
          <LanguageSwitcher />
          <NotificationsDropdown />
          <Button size="sm" variant="accent" magnetic className="hidden sm:inline-flex">
            <Sparkles size={14} /> Get Pro
          </Button>
          <Avatar name="User" size="sm" status="online" />
        </div>
      </nav>
    </motion.header>
  );
}
