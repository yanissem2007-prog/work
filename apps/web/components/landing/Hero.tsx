'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Command } from 'lucide-react';
import { HeroOrb } from '@/components/three/HeroOrb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Magnetic } from '@/components/motion/Magnetic';
import { TextReveal } from '@/components/motion/TextReveal';

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const blur = useTransform(scrollYProgress, [0.4, 1], [0, 12]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <section ref={ref} className="relative min-h-[100dvh] overflow-hidden">
      {/* Aurora backdrop */}
      <div className="absolute inset-0 mesh aurora animate-aurora opacity-80" />
      <div className="absolute inset-0 noise" />

      {/* 3D orb */}
      <motion.div
        style={{ y: orbY, scale: orbScale }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[80vmin] h-[80vmin] opacity-70">
          <HeroOrb />
        </div>
      </motion.div>

      {/* Floating chips parallax */}
      <FloatingChips />

      <motion.div
        style={{ scale, opacity, y, filter }}
        className="relative z-10 mx-auto max-w-5xl px-6 pt-40 md:pt-48 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex justify-center"
        >
          <Badge variant="glass" dot dotColor="var(--accent)">
            Now in private beta · Join the waitlist
          </Badge>
        </motion.div>

        <h1 className="mt-8 font-display text-hero md:text-display tracking-tightest leading-[0.92]">
          <TextReveal text="Where careers" />
          <br />
          <span className="gradient-text italic">
            <TextReveal text="take shape." delay={0.35} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-8 mx-auto max-w-xl text-lg text-muted"
        >
          The professional network reimagined. Jobs, communities, social feed,
          AI assistant, and a CV builder — all in one immersive workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.8 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <Magnetic>
            <Button variant="accent" size="lg" magnetic asChild>
              <Link href="/register">Join WORK <ArrowRight size={16} /></Link>
            </Button>
          </Magnetic>
          <Button variant="glass" size="lg" asChild>
            <Link href="/feed"><Sparkles size={14} /> Explore feed</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          className="mt-10 flex items-center justify-center gap-2 text-xs text-muted"
        >
          <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-surface/50">
            <Command size={11} /> K
          </kbd>
          to search anywhere
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted text-2xs tracking-caps uppercase"
      >
        <span>Scroll</span>
        <div className="w-px h-10 bg-border relative overflow-hidden">
          <motion.div
            className="absolute inset-x-0 top-0 h-3 bg-fg"
            animate={{ y: ['-100%', '400%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
}

function FloatingChips() {
  const chips = [
    { label: '12.4k jobs live', x: '6%', y: '22%', delay: 0 },
    { label: 'AI · GPT-5', x: '86%', y: '18%', delay: 0.4 },
    { label: '4.2k communities', x: '8%', y: '74%', delay: 0.8 },
    { label: '+38% offers', x: '85%', y: '78%', delay: 1.2 }
  ];
  return (
    <>
      {chips.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.3 + c.delay * 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ left: c.x, top: c.y }}
          className="absolute hidden md:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
            className="glass rounded-pill px-4 py-2 text-xs font-medium"
          >
            {c.label}
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}
