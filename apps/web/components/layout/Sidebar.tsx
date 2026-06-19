'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Briefcase, MessageSquare, Users, Sparkles, User, Settings, FileText,
  PlayCircle, Bookmark, UserPlus, Gauge, Mic, Target, Trophy, Zap, Flame,
  ShoppingBag, Calendar, Map, TrendingUp, Compass, Rocket, type LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useTranslations } from 'next-intl';

type NavItem = { href: string; key: string; icon: LucideIcon };
type NavSection = { labelKey?: string; items: NavItem[] };

// Grouped navigation — turns a flat list of 20 destinations into a scannable map.
const SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/home', key: 'home', icon: Home },
      { href: '/feed', key: 'feed', icon: Sparkles },
      { href: '/trending', key: 'trending', icon: TrendingUp }
    ]
  },
  {
    labelKey: 'sectionCareer',
    items: [
      { href: '/jobs', key: 'jobs', icon: Briefcase },
      { href: '/matches', key: 'matches', icon: Target },
      { href: '/cv-builder', key: 'cvBuilder', icon: FileText },
      { href: '/cv-analyzer', key: 'cvScore', icon: Gauge },
      { href: '/interview', key: 'interview', icon: Mic },
      { href: '/coach', key: 'coach', icon: Compass },
      { href: '/roadmap', key: 'roadmaps', icon: Map },
      { href: '/projects', key: 'projects', icon: Rocket },
      { href: '/freelance', key: 'marketplace', icon: ShoppingBag }
    ]
  },
  {
    labelKey: 'sectionNetwork',
    items: [
      { href: '/messages', key: 'messages', icon: MessageSquare },
      { href: '/communities', key: 'communities', icon: Users },
      { href: '/friends', key: 'network', icon: UserPlus },
      { href: '/events', key: 'events', icon: Calendar }
    ]
  },
  {
    labelKey: 'sectionYou',
    items: [
      { href: '/bookmarks', key: 'bookmarks', icon: Bookmark },
      { href: '/stats', key: 'stats', icon: Trophy },
      { href: '/profile', key: 'profile', icon: User }
    ]
  }
];

export function Sidebar() {
  const t = useTranslations('nav');
  const path = usePathname();
  const replay = useOnboardingStore((s) => s.reset);
  const authed = useAuthStore((s) => !!s.accessToken);

  const me = useQuery<{ profile: { totalXp: number; streak: { current: number } }; level: { level: number; progress: number } }>({
    queryKey: ['gamification', 'me'],
    enabled: authed,
    queryFn: async () => (await api.get('/gamification/me')).data.data
  });

  const isActive = (href: string) => path === href || path?.startsWith(href + '/');

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-bg/80 backdrop-blur-md sticky top-0 h-screen">
      <div className="p-5 pb-3">
        <Link href="/" className="flex items-center gap-2 mb-5 px-2 font-display text-lg tracking-tight">
          <span className="inline-block size-7 rounded-lg bg-grad-accent shadow-glow animate-pulse-glow" />
          WORK
        </Link>

        {/* Level chip */}
        {me.data && (
          <Link href="/stats" className="block mx-1 rounded-2xl glass p-3 group hover-lift">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center shrink-0">
                <Zap size={14} className="text-accent-fg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display tracking-tight tabular-nums">Lvl {me.data.level.level}</span>
                  {me.data.profile.streak.current > 0 && (
                    <span className="text-2xs text-warning flex items-center gap-0.5">
                      <Flame size={9} /> {me.data.profile.streak.current}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1 bg-surface-2 rounded overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: me.data.level.progress }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full origin-left bg-grad-accent shadow-glow"
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-muted tabular-nums">
                  {me.data.profile.totalXp.toLocaleString()} XP
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Featured AI entry */}
      <div className="px-5">
        <Link
          href="/ai"
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm overflow-hidden transition-colors',
            'border',
            isActive('/ai')
              ? 'border-accent/40 bg-accent/10 text-fg'
              : 'border-border bg-surface/40 text-fg-soft hover:text-fg hover:border-border-strong'
          )}
        >
          <span className="absolute inset-0 -z-10 mesh opacity-[0.18]" />
          <span className="size-6 rounded-lg bg-grad-accent grid place-items-center shrink-0 shadow-glow">
            <Sparkles size={13} className="text-accent-fg" />
          </span>
          <span className="font-medium">{t('ai')}</span>
          <span className="ml-auto text-[9px] font-mono uppercase tracking-caps text-accent">AI</span>
        </Link>
      </div>

      {/* Scrollable grouped nav */}
      <nav className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {SECTIONS.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {section.labelKey && (
              <p className="px-3 pt-1 pb-1 text-[10px] font-mono uppercase tracking-caps text-muted-2 select-none">
                {t(section.labelKey)}
              </p>
            )}
            {section.items.map(({ href, key, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors duration-fast',
                    active ? 'text-fg' : 'text-muted hover:text-fg hover:bg-surface'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-surface-2 border border-border"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={17} className="relative z-10 shrink-0" />
                  <span className="relative z-10 font-medium truncate">{t(key)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-5 pt-3 border-t border-border flex flex-col gap-0.5">
        <button onClick={replay}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-fg hover:bg-surface transition-colors text-left">
          <PlayCircle size={17} /> Replay tour
        </button>
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-fg hover:bg-surface transition-colors">
          <Settings size={17} /> {t('settings')}
        </Link>
      </div>
    </aside>
  );
}
