'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/motion/Reveal';
import { FileText, Download } from 'lucide-react';

export function CVShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.04, 0.95]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} className="relative py-section overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
        <Reveal>
          <Badge variant="glass"><FileText size={11} /> CV Builder</Badge>
          <h2 className="mt-5 font-display text-4xl md:text-5xl tracking-tighter">
            A CV that <span className="gradient-text">writes itself.</span>
          </h2>
          <p className="mt-5 text-muted text-lg">
            Five templates. Magic AI rewrites. One-click PDF export.
            ATS-ready. Beautifully typeset.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" magnetic><FileText size={16} /> Build my CV</Button>
            <Button variant="glass" size="lg"><Download size={16} /> See templates</Button>
          </div>
        </Reveal>

        <motion.div
          style={{ scale, rotate, y }}
          className="relative aspect-[3/4] rounded-2xl glass-strong overflow-hidden shadow-xl"
        >
          {/* Top bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-bg-elev/50">
            <span className="size-2.5 rounded-full bg-danger/70" />
            <span className="size-2.5 rounded-full bg-warning/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
            <span className="ml-3 text-2xs text-muted font-mono">cv-sara-bouali.pdf</span>
          </div>

          <div className="p-8 md:p-10 space-y-6">
            <div>
              <h3 className="font-display text-3xl tracking-tighter">Sara Bouali</h3>
              <p className="text-sm text-muted">Senior Product Designer · Algiers / Remote</p>
            </div>

            <div className="space-y-2">
              <p className="text-eyebrow">Experience</p>
              <div className="space-y-3 text-sm">
                {[
                  ['Stripe', 'Senior Designer', '2023 — Now', 'Led the redesign of the Atlas onboarding (+38% conversion).'],
                  ['Figma', 'Product Designer', '2020 — 2023', 'Shipped FigJam multiplayer cursors used by 4M+ users.']
                ].map(([co, role, dates, desc]) => (
                  <div key={co}>
                    <div className="flex justify-between text-fg">
                      <span className="font-medium">{co} · <span className="text-muted">{role}</span></span>
                      <span className="text-muted">{dates}</span>
                    </div>
                    <p className="text-muted text-xs mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-eyebrow">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {['Figma', 'Design Systems', 'Motion', 'Prototyping', 'Framer', 'Research'].map((s) =>
                  <Badge key={s} variant="soft">{s}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* AI suggestion floating */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-4 top-1/3 glass-strong rounded-xl px-3 py-2 text-2xs max-w-[180px]"
          >
            <span className="text-accent font-medium">✨ AI suggestion</span>
            <p className="text-muted mt-1">Quantify the FigJam impact — try “4M+ MAU”.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
