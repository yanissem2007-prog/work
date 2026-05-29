'use client';
import { motion } from 'framer-motion';
import { Briefcase, FileText, Users, MessageSquare, Sparkles, Heart, MapPin, Check } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }
});

const float = (dur = 5, delay = 0) => ({
  animate: { y: [0, -8, 0] },
  transition: { duration: dur, delay, repeat: Infinity, ease: 'easeInOut' as const }
});

/* ---------- 1. Find jobs ---------- */
export function FindJobsScene() {
  return (
    <Scene>
      <motion.div {...fadeUp(0.1)} {...float(6)} className="absolute left-8 top-10 glass-strong rounded-2xl p-4 w-56 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-lg bg-grad-accent grid place-items-center shadow-glow">
            <Briefcase size={14} className="text-accent-fg" />
          </div>
          <div className="flex-1">
            <p className="text-2xs text-muted">Stripe</p>
            <p className="text-xs font-medium leading-tight">Senior Engineer</p>
          </div>
        </div>
        <p className="text-2xs text-muted flex items-center gap-1"><MapPin size={10} /> Remote · $220k</p>
        <div className="mt-2 flex gap-1">
          <span className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded">TypeScript</span>
          <span className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded">React</span>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.3)} {...float(7, 0.5)} className="absolute right-6 top-20 glass-strong rounded-2xl p-4 w-52 shadow-lg">
        <span className="text-[10px] text-accent font-medium flex items-center gap-1">
          <Sparkles size={9} /> 96% match
        </span>
        <p className="mt-1 text-xs font-medium">Design Engineer</p>
        <p className="text-2xs text-muted">Linear · SF</p>
      </motion.div>

      <motion.div {...fadeUp(0.5)} {...float(8, 1)} className="absolute left-12 bottom-10 glass-strong rounded-2xl p-3 w-48 shadow-lg">
        <p className="text-xs font-medium">Founding Engineer</p>
        <p className="text-2xs text-muted">Vercel · NYC</p>
      </motion.div>

      <Orb />
    </Scene>
  );
}

/* ---------- 2. Create CV ---------- */
export function CreateCVScene() {
  return (
    <Scene>
      <motion.div {...fadeUp(0.1)} {...float(7)} className="absolute left-1/2 -translate-x-1/2 top-6 glass-strong rounded-2xl p-5 w-64 shadow-xl">
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3].map((i) => (
            <span key={i} className="size-2 rounded-full bg-muted/40" />
          ))}
          <span className="ml-2 text-[10px] text-muted font-mono">cv.pdf</span>
        </div>
        <p className="font-display text-base tracking-tighter">Sara Bouali</p>
        <p className="text-[10px] text-muted">Senior Product Designer</p>
        <div className="mt-3 space-y-1.5">
          {[80, 70, 90, 60].map((w, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-1.5 bg-surface-2 rounded origin-left"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.4)} {...float(6, 0.7)} className="absolute right-4 top-1/3 glass-strong rounded-xl px-3 py-2 max-w-[170px]">
        <p className="text-2xs text-accent font-medium flex items-center gap-1">
          <Sparkles size={10} /> AI rewrote
        </p>
        <p className="text-[10px] text-muted mt-0.5">18 bullets sharpened.</p>
      </motion.div>

      <motion.div {...fadeUp(0.6)} {...float(8, 1.2)} className="absolute left-4 bottom-8 glass-strong rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="size-6 rounded-md bg-success/20 grid place-items-center"><Check size={12} className="text-success" /></div>
        <span className="text-2xs">ATS-ready · 92/100</span>
      </motion.div>
    </Scene>
  );
}

/* ---------- 3. Communities ---------- */
export function CommunitiesScene() {
  const items = [
    { name: 'Frontend Cult', members: '24.1k', y: 'top-8', x: 'left-6', delay: 0.1, color: 'oklch(72% 0.2 264)' },
    { name: 'Design Heroes', members: '18.6k', y: 'top-4', x: 'right-6', delay: 0.25, color: 'oklch(70% 0.24 340)' },
    { name: 'Algeria Tech', members: '9.4k', y: 'bottom-16', x: 'left-10', delay: 0.4, color: 'oklch(80% 0.14 200)' },
    { name: 'CS Students', members: '32.7k', y: 'bottom-8', x: 'right-12', delay: 0.55, color: 'oklch(85% 0.18 130)' }
  ];
  return (
    <Scene>
      {items.map((c, i) => (
        <motion.div
          key={c.name}
          {...fadeUp(c.delay)} {...float(6 + i, c.delay)}
          className={`absolute ${c.x} ${c.y} glass-strong rounded-2xl p-3 w-44`}
        >
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl grid place-items-center shadow-glow"
              style={{ background: `linear-gradient(135deg, ${c.color}, oklch(70% 0.24 340))` }}>
              <Users size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium leading-tight">{c.name}</p>
              <p className="text-[10px] text-muted">{c.members} members</p>
            </div>
          </div>
        </motion.div>
      ))}
      <Orb />
    </Scene>
  );
}

/* ---------- 4. Recruiters ---------- */
export function RecruitersScene() {
  return (
    <Scene>
      <motion.div {...fadeUp(0.1)} {...float(7)} className="absolute left-6 top-10 glass-strong rounded-2xl px-3 py-2 w-52">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-grad-accent shadow-glow" />
          <div>
            <p className="text-xs font-medium leading-tight">Mia Tanaka</p>
            <p className="text-[10px] text-muted">Head of Talent · Linear</p>
          </div>
        </div>
        <div className="mt-2 bg-surface-2 rounded-xl rounded-tl-sm px-2.5 py-1.5">
          <p className="text-2xs">Hey Sara — love your portfolio. Free this week?</p>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.4)} {...float(8, 0.5)} className="absolute right-6 bottom-12 glass-strong rounded-2xl px-3 py-2 w-48">
        <span className="text-2xs text-accent font-medium">You</span>
        <div className="mt-1 bg-grad-accent text-accent-fg rounded-xl rounded-tr-sm px-2.5 py-1.5">
          <p className="text-2xs">Yes! Thursday at 3?</p>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.7)} {...float(6, 0.8)} className="absolute right-4 top-6 glass-strong rounded-pill px-3 py-1.5 text-2xs flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-success animate-pulse-glow" />
        47 recruiters viewed
      </motion.div>
    </Scene>
  );
}

/* ---------- 5. AI assistant ---------- */
export function AIScene() {
  return (
    <Scene>
      <motion.div {...fadeUp(0.1)} className="absolute left-6 right-6 top-1/2 -translate-y-1/2 glass-strong rounded-2xl p-4 space-y-2">
        <div className="ml-12 bg-grad-accent text-accent-fg text-xs rounded-2xl rounded-tr-sm px-3 py-2 inline-block self-end">
          Rewrite my CV for Senior PM.
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-surface-2 text-xs rounded-2xl rounded-tl-sm px-3 py-2 mr-12 inline-block"
        >
          <p className="text-[10px] text-muted mb-1 flex items-center gap-1">
            <Sparkles size={10} className="text-accent" /> WORK AI
          </p>
          Rephrased 18 bullets with measurable outcomes.
        </motion.div>
      </motion.div>

      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-2 rounded-full bg-accent/50 shadow-glow"
          style={{ left: `${15 + i * 12}%`, top: `${i % 2 === 0 ? '15%' : '80%'}` }}
          animate={{ y: [0, -16, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </Scene>
  );
}

/* ---------- 6. Post & interact ---------- */
export function FeedScene() {
  return (
    <Scene>
      <motion.div {...fadeUp(0.1)} {...float(7)} className="absolute left-6 right-6 top-8 glass-strong rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-full bg-grad-accent shadow-glow" />
          <div>
            <p className="text-xs font-medium">Yacine Berrouba</p>
            <p className="text-[10px] text-muted">Founder · Atlas · 2h</p>
          </div>
        </div>
        <p className="text-xs">Shipping our first AI-native onboarding today. The team killed it. 🚀</p>
        <div className="mt-3 flex gap-3 text-muted text-2xs">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="flex items-center gap-1 text-danger"
          >
            <Heart size={11} fill="currentColor" /> 1.2k
          </motion.span>
          <span className="flex items-center gap-1"><MessageSquare size={11} /> 142</span>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.5)} {...float(8, 0.5)} className="absolute left-12 bottom-8 glass-strong rounded-2xl px-3 py-2 flex items-center gap-2">
        <FileText size={14} className="text-accent" />
        <span className="text-2xs">Composing a post…</span>
      </motion.div>
    </Scene>
  );
}

/* shared */
function Scene({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl bg-grad-mesh">
      <div className="absolute inset-0 noise" />
      {children}
    </div>
  );
}

function Orb() {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-32 rounded-full bg-grad-accent opacity-30 blur-2xl"
    />
  );
}
