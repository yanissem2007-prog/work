'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, MessageSquare, Users, Sparkles, User, Settings, FileText, PlayCircle, Bookmark, UserPlus, Gauge, Mic, Target, Trophy, Zap, Flame, ShoppingBag, Calendar, Map, TrendingUp, Compass, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useTranslations } from 'next-intl';

const NAV = [
  { href: '/home', key: 'home', icon: Home },
  { href: '/feed', key: 'feed', icon: Sparkles },
  { href: '/trending', key: 'trending', icon: TrendingUp },
  { href: '/jobs', key: 'jobs', icon: Briefcase },
  { href: '/matches', key: 'matches', icon: Target },
  { href: '/messages', key: 'messages', icon: MessageSquare },
  { href: '/communities', key: 'communities', icon: Users },
  { href: '/friends', key: 'network', icon: UserPlus },
  { href: '/bookmarks', key: 'bookmarks', icon: Bookmark },
  { href: '/ai', key: 'ai', icon: Sparkles },
  { href: '/cv-builder', key: 'cvBuilder', icon: FileText },
  { href: '/cv-analyzer', key: 'cvScore', icon: Gauge },
  { href: '/interview', key: 'interview', icon: Mic },
  { href: '/coach', key: 'coach', icon: Compass },
  { href: '/projects', key: 'projects', icon: Rocket },
  { href: '/freelance', key: 'marketplace', icon: ShoppingBag },
  { href: '/events', key: 'events', icon: Calendar },
  { href: '/roadmap', key: 'roadmaps', icon: Map },
  { href: '/stats', key: 'stats', icon: Trophy },
  { href: '/profile', key: 'profile', icon: User }
] as const;

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

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-bg/80 backdrop-blur-md sticky top-0 h-screen p-5">
      <Link href="/" className="flex items-center gap-2 mb-6 px-2 font-display text-lg">
        <span className="inline-block size-7 rounded-lg bg-grad-accent shadow-glow animate-pulse-glow" />
        WORK
      </Link>

      {/* Level chip */}
      {me.data && (
        <Link href="/stats" className="mb-5 mx-1 rounded-2xl glass p-3 group">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center">
              <Zap size={14} className="text-accent-fg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display tracking-tighter tabular-nums">Lvl {me.data.level.level}</span>
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

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = path?.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-fast',
                active ? 'text-fg' : 'text-muted hover:text-fg hover:bg-surface'
              )}>
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-surface-2 border border-border"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={17} className="relative z-10" />
              <span className="relative z-10 font-medium">{t(key)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        <button onClick={replay}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-fg hover:bg-surface transition text-left">
          <PlayCircle size={17} /> Replay tour
        </button>
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-fg hover:bg-surface transition">
          <Settings size={17} /> Settings
        </Link>
      </div>
    </aside>
  );
}
