'use client';
import type { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, X, Check, Zap, Bot, Trophy, Rocket,
  User as UserIcon, FileText, Users2, MessageSquare, Compass, Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore, ONBOARDING_TOTAL, type MissionState } from '@/stores/onboardingStore';
import { SCENES } from './StepScenes';
import { Particles } from '@/components/effects/Particles';
import { AnimatedNumber } from '@/components/micro';
import { cn } from '@/lib/utils';

interface StepDef {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  guide: string;
}

const STEPS: StepDef[] = [
  { id: 'welcome',       eyebrow: 'Step 01 · Boot sequence', title: (<>Welcome to <span className="gradient-text italic">WORK</span>.</>),                 body: "You're entering the operating system for your career. Jobs, communities, AI, gamification — all in one place.", guide: "Hi. I'm WORK AI. I'll walk you through everything in under 2 minutes." },
  { id: 'identity',      eyebrow: 'Step 02 · Identity',      title: (<>Create your <span className="gradient-text italic">identity</span>.</>),            body: 'Profile, avatar, bio, skills, portfolio, CV — recruiters see all of it.',                                       guide: 'A complete profile gets 3.4× more recruiter views.' },
  { id: 'jobs',          eyebrow: 'Step 03 · Opportunities', title: (<>Discover <span className="gradient-text italic">jobs</span> that pick you.</>),     body: 'Search 240k+ live roles. AI surfaces matches with explanations — you stay in the top 0.1%.',                  guide: 'Stop scrolling job boards. Let the boards scroll to you.' },
  { id: 'social',        eyebrow: 'Step 04 · Network',       title: (<>The <span className="gradient-text italic">social</span> universe.</>),             body: 'Post, like, comment, repost, bookmark. Follow the people building what comes next.',                            guide: 'Networks compound. Plant seeds before you need them.' },
  { id: 'communities',   eyebrow: 'Step 05 · Communities',   title: (<>Find your <span className="gradient-text italic">tribe</span>.</>),                 body: 'Discord-style spaces with channels, events, and moderation — for engineers, designers, students, founders.',  guide: 'The best opportunities live inside the right community. Join two today.' },
  { id: 'ai',            eyebrow: 'Step 06 · AI',            title: (<>Your AI <span className="gradient-text italic">copilot</span>.</>),                 body: 'CV analyzer, mock interviewer, roadmap generator, project ideas, career coach. Always on. Always tailored.',  guide: 'Hit ⌘I anywhere — I am one keystroke away.' },
  { id: 'messaging',     eyebrow: 'Step 07 · Messaging',     title: (<>Talk to <span className="gradient-text italic">anyone</span>.</>),                  body: 'DMs, group chats, recruiter inbox. Reactions, attachments, presence, typing — all real-time.',                guide: "Recruiters here actually reply. The platform punishes the ones who don't." },
  { id: 'gamification',  eyebrow: 'Step 08 · Progress',      title: (<>Earn <span className="gradient-text italic">XP</span>. Unlock badges.</>),          body: 'Every action moves your level and streak — visible signal that compounds.',                                    guide: "You're already at " },
  { id: 'mission',       eyebrow: 'Step 09 · First mission', title: (<>Your <span className="gradient-text italic">first mission</span> starts now.</>),  body: 'Six quick wins to unlock the platform. Each one earns XP. Each one moves the needle.',                          guide: 'Ten minutes. Future-you will thank Today-you.' }
];

interface MissionItem {
  key: keyof MissionState;
  label: string;
  xp: number;
  href: string;
  icon: LucideIcon;
}

const MISSIONS: MissionItem[] = [
  { key: 'profile',         label: 'Complete your profile',  xp: 50, href: '/profile',     icon: UserIcon },
  { key: 'cv',              label: 'Build your first CV',    xp: 50, href: '/cv-builder',  icon: FileText },
  { key: 'community',       label: 'Join a community',       xp: 25, href: '/communities', icon: Users2 },
  { key: 'firstPost',       label: 'Post to the feed',       xp: 25, href: '/feed',        icon: MessageSquare },
  { key: 'generateRoadmap', label: 'Generate an AI roadmap', xp: 40, href: '/roadmap',     icon: Compass },
  { key: 'aiInteract',      label: 'Chat with the AI',       xp: 25, href: '/ai',          icon: Bot }
];

export function Onboarding() {
  const { open, step, xp, missions, next, prev, setStep, skip, complete } = useOnboardingStore();

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, next, prev, skip]);

  useEffect(() => {
    if (!open) return;
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = o; };
  }, [open]);

  const def = STEPS[step];
  const Scene = SCENES[step];
  const progress = ((step + 1) / ONBOARDING_TOTAL) * 100;
  const isFinal = step === ONBOARDING_TOTAL - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] grid place-items-center p-3 sm:p-6"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
          <Particles density={20} className="fixed inset-0 -z-10" />

          {/* Top progress */}
          <div className="absolute top-0 inset-x-0 h-1 bg-border/40 z-30">
            <motion.div
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="h-full origin-left bg-grad-accent shadow-glow"
            />
          </div>

          <button onClick={skip}
            className="absolute top-4 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill glass text-muted hover:text-fg transition text-xs"
            aria-label="Skip onboarding"
          >Skip <X size={12} /></button>

          <motion.div
            key={xp}
            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="absolute top-4 left-4 z-30 inline-flex items-center gap-2 px-3 py-1.5 rounded-pill glass shadow-glow"
          >
            <Zap size={12} className="text-accent" />
            <span className="text-xs font-medium tabular-nums">
              <AnimatedNumber value={xp} /> XP
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.97, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-6xl rounded-3xl glass-strong overflow-hidden shadow-xl border border-border/60 flex flex-col lg:flex-row"
          >
            {/* Scene */}
            <div className="relative w-full lg:w-7/12 aspect-[16/10] lg:aspect-auto lg:h-[620px] p-3 lg:p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={def.id}
                  initial={{ opacity: 0, scale: 0.96, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  <Scene />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Copy + controls */}
            <div className="relative w-full lg:w-5/12 p-7 lg:p-10 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={def.id + '-copy'}
                  initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-eyebrow mb-3">{def.eyebrow}</p>
                  <h2 className="font-display text-3xl lg:text-4xl tracking-tightest leading-[1.05]">{def.title}</h2>
                  <p className="mt-4 text-muted leading-relaxed">{def.body}</p>

                  <div className="mt-5 flex items-start gap-3 p-3 rounded-2xl bg-surface-2/40 border border-border">
                    <div className="size-9 rounded-xl bg-grad-accent shadow-glow grid place-items-center shrink-0 animate-pulse-glow">
                      <Bot size={14} className="text-accent-fg" />
                    </div>
                    <div>
                      <p className="text-2xs uppercase tracking-caps text-accent flex items-center gap-1.5">
                        <Sparkles size={10} /> WORK AI
                      </p>
                      <p className="text-sm mt-0.5">
                        {def.guide}
                        {def.id === 'gamification' && (
                          <>
                            <span className="font-medium text-accent">
                              <AnimatedNumber value={xp} className="tabular-nums" /> XP
                            </span>
                            {' — keep going.'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {isFinal && <MissionList missions={missions} />}
                </motion.div>
              </AnimatePresence>

              <div className="mt-7 flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`} className="group p-1">
                    <motion.span
                      animate={{
                        width: i === step ? 28 : 8,
                        backgroundColor: i === step
                          ? 'var(--accent)'
                          : i < step ? 'var(--fg-soft)' : 'var(--border-strong)'
                      }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="block h-1.5 rounded-full"
                    />
                  </button>
                ))}
                <span className="ml-auto text-2xs text-muted font-mono">
                  {String(step + 1).padStart(2, '0')} / {String(ONBOARDING_TOTAL).padStart(2, '0')}
                </span>
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="glass" size="lg" onClick={prev} disabled={step === 0} aria-label="Previous">
                  <ArrowLeft size={16} />
                </Button>
                {isFinal ? (
                  <Button variant="accent" size="lg" magnetic onClick={complete} className="flex-1">
                    <Rocket size={16} /> Launch into WORK
                  </Button>
                ) : (
                  <Button variant="accent" size="lg" magnetic onClick={next} className="flex-1">
                    Continue <ArrowRight size={16} />
                  </Button>
                )}
              </div>

              <p className="mt-4 text-2xs text-muted hidden md:block">
                <kbd className="px-1 py-0.5 rounded border border-border bg-surface text-[10px]">←</kbd>
                <kbd className="ml-1 px-1 py-0.5 rounded border border-border bg-surface text-[10px]">→</kbd>
                {' '}navigate ·
                <kbd className="ml-1 px-1 py-0.5 rounded border border-border bg-surface text-[10px]">esc</kbd> skip
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MissionList({ missions }: { missions: MissionState }) {
  const done = MISSIONS.filter((m) => missions[m.key]).length;
  const total = MISSIONS.length;
  const pct = (done / total) * 100;
  const maxXp = MISSIONS.reduce((s, m) => s + m.xp, 0);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-eyebrow flex items-center gap-1.5">
          <Trophy size={11} className="text-warning" /> First missions
        </p>
        <span className="text-2xs text-muted tabular-nums">
          <AnimatedNumber value={done} /> / {total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-3">
        <motion.div
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full origin-left bg-grad-accent shadow-glow"
        />
      </div>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {MISSIONS.map((m, i) => {
          const isDone = !!missions[m.key];
          return (
            <motion.li key={m.key}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}>
              <Link href={m.href} className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 transition',
                isDone ? 'bg-success/10 text-success' : 'bg-surface hover:bg-surface-2'
              )}>
                <span className={cn(
                  'size-7 rounded-lg grid place-items-center shrink-0',
                  isDone ? 'bg-success/20' : 'bg-bg-elev'
                )}>
                  {isDone ? <Check size={13} /> : <m.icon size={13} />}
                </span>
                <p className={cn('flex-1 text-sm', isDone && 'line-through opacity-70')}>{m.label}</p>
                <span className="text-2xs font-medium tabular-nums">+{m.xp} XP</span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
      <div className="mt-3 inline-flex items-center gap-1.5 text-2xs text-muted">
        <Award size={11} className="text-accent" />
        Earn <AnimatedNumber value={maxXp} className="font-medium text-fg" /> XP by finishing them all.
      </div>
    </div>
  );
}
