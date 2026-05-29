'use client';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Gauge, Briefcase, Mic, Users, Crown, Award, Trophy, Flame, Zap, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles, FileText, Gauge, Briefcase, Mic, Users, Crown, Award, Trophy, Flame, Zap, UserPlus
};

const TONE = {
  common:    'oklch(78% 0.18 200)',
  rare:      'oklch(72% 0.2 264)',
  epic:      'oklch(70% 0.24 340)',
  legendary: 'oklch(75% 0.22 50)'
} as const;

interface Props {
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: boolean;
}

export function Badge3D({ name, description, icon, rarity, owned }: Props) {
  const Icon = ICONS[icon] ?? Sparkles;
  const tone = TONE[rarity];

  return (
    <motion.div
      whileHover={owned ? { rotateX: -8, rotateY: 8, scale: 1.04 } : undefined}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={cn(
        'group relative rounded-2xl border overflow-hidden p-4 text-center transition-colors',
        owned
          ? 'border-border bg-bg-elev/60'
          : 'border-dashed border-border/60 bg-surface opacity-55 grayscale'
      )}
      style={{ perspective: 800 }}
    >
      {/* Animated background only when owned */}
      {owned && (
        <>
          <div className="absolute inset-0 -z-10 opacity-50 blur-2xl"
            style={{ background: `radial-gradient(circle at 50% 30%, ${tone}, transparent 60%)` }} />
          <motion.div
            className="absolute inset-0 -z-10 mix-blend-overlay"
            style={{ background: `conic-gradient(from 0deg, ${tone}33, transparent 30%, ${tone}33)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      <motion.div
        animate={owned ? { y: [0, -4, 0] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto size-14 rounded-2xl grid place-items-center shadow-glow"
        style={{ background: owned ? `linear-gradient(135deg, ${tone}, var(--accent))` : 'var(--surface-2)' }}
      >
        <Icon size={20} className={owned ? 'text-white' : 'text-muted'} />
      </motion.div>

      <p className="mt-3 text-sm font-medium">{name}</p>
      <p className="mt-0.5 text-2xs text-muted line-clamp-2 min-h-[1.6em]">{description}</p>
      <p className="mt-2 text-[10px] uppercase tracking-caps"
        style={{ color: owned ? tone : 'var(--muted)' }}>
        {rarity}
      </p>
    </motion.div>
  );
}
