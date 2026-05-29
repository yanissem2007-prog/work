'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge3D } from '@/components/gamification/Badge3D';
import { LevelBar } from '@/components/gamification/LevelBar';

interface MeResponse {
  profile: { totalXp: number; level: number; streak: { current: number; best: number }; badges: { id: string; awardedAt: string }[]; counts: Record<string, number> };
  level: { level: number; xpInLevel: number; xpForNext: number; progress: number };
  badges: { id: string; name: string; description: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; icon: string; owned: boolean; awardedAt?: string }[];
}

export default function StatsPage() {
  const me = useQuery<MeResponse>({
    queryKey: ['gamification', 'me'],
    queryFn: async () => (await api.get('/gamification/me')).data.data
  });

  const board = useQuery<any[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => (await api.get('/gamification/leaderboard', { params: { limit: 10 } })).data.data
  });

  const events = useQuery<{ _id: string; type: string; xp: number; createdAt: string }[]>({
    queryKey: ['xp', 'events'],
    queryFn: async () => (await api.get('/gamification/events')).data.data
  });

  if (me.isLoading || !me.data) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const { profile, level, badges } = me.data;
  const owned = badges.filter((b) => b.owned).length;
  const totalBadges = badges.length;

  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Trophy size={11} /> Your stats
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tightest">
          Keep the <span className="gradient-text italic">streak alive</span>.
        </h1>
      </header>

      {/* Top row */}
      <div className="grid lg:grid-cols-[1.2fr_1fr_1fr] gap-3">
        <LevelBar
          level={level.level}
          xpInLevel={level.xpInLevel}
          xpForNext={level.xpForNext}
          progress={level.progress}
          totalXp={profile.totalXp}
        />

        <Card variant="glass" className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-50 bg-grad-aurora" />
            <div className="relative size-12 rounded-2xl bg-gradient-to-br from-[oklch(75%_0.22_50)] to-[oklch(70%_0.22_25)] shadow-glow grid place-items-center">
              <Flame size={16} className="text-white" />
            </div>
          </div>
          <div>
            <p className="font-display text-xl tracking-tighter tabular-nums">{profile.streak.current} days</p>
            <p className="text-2xs text-muted">Current streak · best {profile.streak.best}</p>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-grad-accent shadow-glow grid place-items-center">
            <Award size={16} className="text-accent-fg" />
          </div>
          <div>
            <p className="font-display text-xl tracking-tighter tabular-nums">{owned} / {totalBadges}</p>
            <p className="text-2xs text-muted">Badges unlocked</p>
          </div>
        </Card>
      </div>

      {/* Badges */}
      <section>
        <header className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl tracking-tighter">Badges</h2>
          <span className="text-eyebrow">{owned} owned · {totalBadges - owned} to go</span>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {badges.map((b, i) => (
            <motion.div key={b.id}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <Badge3D {...b} />
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Recent XP feed */}
        <section>
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl tracking-tighter">Recent activity</h2>
            <span className="text-eyebrow flex items-center gap-1"><TrendingUp size={11} /> {events.data?.length ?? 0} events</span>
          </header>
          <div className="space-y-2">
            {events.data?.length === 0 && (
              <Card variant="glass" className="text-center py-8">
                <p className="text-sm text-muted">No activity yet — keep going.</p>
              </Card>
            )}
            {events.data?.slice(0, 14).map((e, i) => (
              <motion.div key={e._id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Zap size={14} className="text-accent shrink-0" />
                <p className="flex-1 text-sm truncate capitalize">{e.type.replaceAll('.', ' · ')}</p>
                <span className="text-xs font-medium tabular-nums text-accent">+{e.xp} XP</span>
                <span className="text-2xs text-muted">{new Date(e.createdAt).toLocaleDateString()}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl tracking-tighter">Leaderboard</h2>
            <span className="text-eyebrow">Top 10</span>
          </header>
          <div className="space-y-2">
            {board.data?.map((row, i) => (
              <motion.div key={row.rank}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}>
                <Card variant="glass" className="flex items-center gap-3">
                  <span className="font-display text-lg tracking-tighter tabular-nums w-6 text-center"
                    style={{ color: i < 3 ? ['oklch(75% 0.22 50)','oklch(78% 0.06 0)','oklch(60% 0.13 50)'][i] : 'var(--muted)' }}>
                    {row.rank}
                  </span>
                  <Link href={`/profile/${row.user?.handle}`}>
                    <Avatar src={row.user?.avatar} name={row.user?.name ?? '—'} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.user?.name}</p>
                    <p className="text-2xs text-muted">Lvl {row.level} · {row.badges} badges</p>
                  </div>
                  <Badge variant="soft" className="tabular-nums">{row.totalXp.toLocaleString()} XP</Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
