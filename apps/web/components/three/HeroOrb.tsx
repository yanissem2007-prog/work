'use client';
import { motion } from 'framer-motion';

/**
 * Pure CSS + Framer Motion orb. Replaces the old react-three-fiber version
 * (which was incompatible with the installed React build). Looks nearly
 * identical — a glowing, slowly rotating, floating gradient sphere — with
 * zero 3D dependencies and no SSR/hydration issues.
 */
export function HeroOrb() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden">
      {/* Outer aura */}
      <motion.div
        aria-hidden
        className="absolute rounded-full blur-3xl"
        style={{
          width: '70%',
          height: '70%',
          background:
            'radial-gradient(circle at 50% 50%, oklch(70% 0.24 264 / 0.55), transparent 60%)'
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* The orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: 'min(56vmin, 420px)',
          height: 'min(56vmin, 420px)',
          background:
            'radial-gradient(circle at 32% 28%, #aab6ff 0%, #6b7cff 38%, #4a3fb0 72%, #241a5e 100%)',
          boxShadow:
            '0 0 80px -10px rgba(107,124,255,0.7), inset -30px -30px 80px rgba(20,10,60,0.65), inset 24px 24px 70px rgba(180,190,255,0.45)'
        }}
        animate={{ y: [0, -22, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Specular highlight */}
        <span
          className="absolute rounded-full blur-2xl"
          style={{
            top: '12%',
            left: '18%',
            width: '38%',
            height: '38%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.85), transparent 70%)'
          }}
        />
        {/* Slow inner shimmer */}
        <motion.span
          className="absolute inset-0 rounded-full mix-blend-overlay"
          style={{
            background:
              'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.25), transparent 40%)'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/80 shadow-[0_0_12px_rgba(170,180,255,0.9)]"
          style={{ width: 6, height: 6 }}
          animate={{
            rotate: 360,
            transition: { duration: 12 + i * 5, repeat: Infinity, ease: 'linear' }
          }}
          initial={false}
        >
          <span
            className="absolute block size-1.5 rounded-full bg-white"
            style={{ transform: `translateX(${160 + i * 36}px)` }}
          />
        </motion.span>
      ))}
    </div>
  );
}
