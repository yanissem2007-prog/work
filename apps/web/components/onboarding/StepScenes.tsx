'use client';
import { motion } from 'framer-motion';
import {
  Sparkles, User as UserIcon, Briefcase, MessageSquare, Users2,
  Bot, MessagesSquare, Trophy, Rocket, FileText, Heart, MapPin
} from 'lucide-react';

const float = (d = 5, delay = 0) => ({
  animate: { y: [0, -8, 0] },
  transition: { duration: d, delay, repeat: Infinity, ease: 'easeInOut' as const }
});
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }
});

function Scene({ children, accent = 'oklch(72% 0.2 264)' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${accent}, oklch(70% 0.24 340))` }} />
      <div className="absolute inset-0 noise opacity-30" />
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full blur-3xl opacity-50"
        style={{ background: accent }}
      />
      {children}
    </div>
  );
}

/* 1 — Welcome */
export function WelcomeScene() {
  return (
    <Scene accent="oklch(72% 0.2 264)">
      <motion.div
        {...fadeUp(0.1)}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="mx-auto size-28 rounded-3xl bg-grad-accent shadow-glow grid place-items-center mb-5"
        >
          <span className="font-display text-3xl tracking-tightest text-accent-fg">W</span>
        </motion.div>
        <p className="text-white/90 text-2xs uppercase tracking-caps">System online</p>
      </motion.div>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-1 rounded-full bg-white/70 shadow-glow"
          style={{ left: `${10 + (i * 47) % 80}%`, top: `${15 + (i * 31) % 70}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3 + i % 4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </Scene>
  );
}

/* 2 — Identity */
export function IdentityScene() {
  return (
    <Scene accent="oklch(70% 0.24 340)">
      <motion.div {...fadeUp(0.1)} {...float(6)} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-strong rounded-2xl p-5 w-64">
        <div className="size-14 rounded-2xl bg-grad-accent mx-auto shadow-glow grid place-items-center mb-3">
          <UserIcon size={18} className="text-accent-fg" />
        </div>
        <p className="text-center font-display tracking-tighter">Your name</p>
        <p className="text-center text-2xs text-muted">Senior Engineer · Algiers</p>
        <div className="mt-3 flex gap-1 justify-center">
          {['TypeScript','React','AWS'].map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2">{s}</span>
          ))}
        </div>
      </motion.div>
      <motion.div {...fadeUp(0.4)} {...float(7,0.4)} className="absolute right-4 top-8 glass-strong rounded-xl p-2 text-2xs">
        <Sparkles size={11} className="text-accent inline mr-1" /> AI scored your CV: <b>87</b>
      </motion.div>
      <motion.div {...fadeUp(0.6)} {...float(8,0.8)} className="absolute left-4 bottom-8 glass-strong rounded-xl p-2 text-2xs">
        <FileText size={11} className="inline mr-1" /> Portfolio attached
      </motion.div>
    </Scene>
  );
}

/* 3 — Jobs */
export function JobsScene() {
  return (
    <Scene accent="oklch(78% 0.18 200)">
      <motion.div {...fadeUp(0.1)} {...float(6)} className="absolute left-6 top-10 glass-strong rounded-2xl p-4 w-56">
        <Briefcase size={14} className="text-accent mb-2" />
        <p className="text-xs font-medium">Senior Engineer</p>
        <p className="text-2xs text-muted">Stripe · Remote · $220k</p>
        <span className="mt-2 inline-block text-[10px] text-accent">✦ 96% match</span>
      </motion.div>
      <motion.div {...fadeUp(0.3)} {...float(7,0.5)} className="absolute right-8 top-16 glass-strong rounded-2xl p-4 w-48">
        <p className="text-xs font-medium">Founding Eng</p>
        <p className="text-2xs text-muted">Vercel · NYC</p>
      </motion.div>
      <motion.div {...fadeUp(0.5)} {...float(8,1)} className="absolute left-1/2 -translate-x-1/2 bottom-8 glass-strong rounded-pill px-3 py-1.5 text-2xs">
        <MapPin size={11} className="inline mr-1" /> 240k+ live roles
      </motion.div>
    </Scene>
  );
}

/* 4 — Social */
export function SocialScene() {
  return (
    <Scene accent="oklch(70% 0.24 340)">
      <motion.div {...fadeUp(0.1)} {...float(7)} className="absolute left-6 right-6 top-8 glass-strong rounded-2xl p-4">
        <p className="text-2xs text-muted">Yacine · 2h</p>
        <p className="text-xs mt-1">Shipped our AI-native onboarding today. 🚀</p>
        <div className="mt-2 flex gap-3 text-2xs text-muted">
          <span><Heart size={10} className="inline text-danger" fill="currentColor" /> 1.2k</span>
          <span><MessageSquare size={10} className="inline" /> 142</span>
        </div>
      </motion.div>
      <motion.div {...fadeUp(0.4)} {...float(8,0.5)} className="absolute right-4 bottom-12 glass-strong rounded-pill px-3 py-1.5 text-2xs">
        +24 new followers
      </motion.div>
    </Scene>
  );
}

/* 5 — Communities */
export function CommunitiesScene() {
  const dots = [
    { x: 6, y: 10, label: 'Frontend Cult' },
    { x: 60, y: 8, label: 'Design Heroes' },
    { x: 10, y: 60, label: 'CS Students' },
    { x: 55, y: 65, label: 'Algeria Tech' }
  ];
  return (
    <Scene accent="oklch(78% 0.22 142)">
      {dots.map((d, i) => (
        <motion.div key={d.label}
          {...fadeUp(0.1 + i * 0.1)} {...float(6 + i, i * 0.3)}
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
          className="absolute glass-strong rounded-xl p-3 w-40">
          <Users2 size={13} className="text-accent mb-1.5" />
          <p className="text-xs font-medium">{d.label}</p>
          <p className="text-2xs text-muted">channels · members</p>
        </motion.div>
      ))}
    </Scene>
  );
}

/* 6 — AI */
export function AIScene() {
  return (
    <Scene accent="oklch(72% 0.2 264)">
      <motion.div
        animate={{ scale: [1, 1.06, 1], rotate: [0, 360] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-28 rounded-full bg-grad-accent shadow-glow grid place-items-center"
      >
        <Bot size={28} className="text-accent-fg" />
      </motion.div>
      <motion.div {...fadeUp(0.4)} className="absolute right-6 top-8 glass-strong rounded-2xl p-3 w-52 text-2xs">
        Suggest 5 jobs that match my skills.
      </motion.div>
      <motion.div {...fadeUp(0.7)} className="absolute left-6 bottom-8 glass-strong rounded-2xl p-3 w-56 text-2xs">
        <span className="text-accent">✦ WORK AI</span><br/>
        Found 12 — top 3 fit your stack 92%.
      </motion.div>
    </Scene>
  );
}

/* 7 — Messaging */
export function MessagingScene() {
  return (
    <Scene accent="oklch(75% 0.22 50)">
      <motion.div {...fadeUp(0.1)} {...float(7)} className="absolute left-6 top-10 glass-strong rounded-2xl px-3 py-2 w-52">
        <p className="text-2xs text-muted">Mia · Head of Talent · Linear</p>
        <p className="text-xs mt-1">Hey Sara — free this week?</p>
      </motion.div>
      <motion.div {...fadeUp(0.5)} {...float(6,0.5)} className="absolute right-6 bottom-10 glass-strong rounded-2xl px-3 py-2 w-44">
        <p className="text-2xs text-muted">You</p>
        <p className="text-xs mt-1">Thursday 3pm?</p>
      </motion.div>
      <motion.div {...fadeUp(0.8)} className="absolute right-4 top-6 glass-strong rounded-pill px-3 py-1 text-2xs flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-success animate-pulse-glow" /> Online
      </motion.div>
    </Scene>
  );
}

/* 8 — Achievements */
export function AchievementsScene() {
  return (
    <Scene accent="oklch(75% 0.22 50)">
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-3xl bg-gradient-to-br from-warning to-danger shadow-glow grid place-items-center"
      >
        <Trophy size={28} className="text-white" />
      </motion.div>
      <motion.div {...fadeUp(0.4)} className="absolute left-6 top-8 glass-strong rounded-xl p-2 text-2xs">
        <Sparkles size={11} className="inline text-accent" /> +25 XP — Step complete
      </motion.div>
      <motion.div {...fadeUp(0.7)} className="absolute right-6 bottom-8 glass-strong rounded-xl p-2 text-2xs">
        🔥 Streak: 7 days
      </motion.div>
    </Scene>
  );
}

/* 9 — Mission ready */
export function MissionScene() {
  return (
    <Scene accent="oklch(78% 0.22 142)">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-28 rounded-3xl bg-grad-accent shadow-glow grid place-items-center"
      >
        <Rocket size={32} className="text-accent-fg" />
      </motion.div>
      <motion.div {...fadeUp(0.4)} className="absolute left-6 top-8 glass-strong rounded-xl p-2 text-2xs">
        Mission 1 unlocked
      </motion.div>
      <motion.div {...fadeUp(0.6)} className="absolute right-6 top-16 glass-strong rounded-xl p-2 text-2xs">
        Profile +25 XP
      </motion.div>
      <motion.div {...fadeUp(0.8)} className="absolute left-10 bottom-10 glass-strong rounded-xl p-2 text-2xs">
        AI guide ready
      </motion.div>
    </Scene>
  );
}

export const SCENES = [
  WelcomeScene, IdentityScene, JobsScene, SocialScene, CommunitiesScene,
  AIScene, MessagingScene, AchievementsScene, MissionScene
];
