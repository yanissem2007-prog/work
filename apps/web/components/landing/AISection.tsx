'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Reveal } from '@/components/motion/Reveal';

const STEPS = [
  { q: 'Suggest 5 startups that match my skills.', a: 'Found 12 startups hiring at your level. Top 3: Linear, Vercel, Arc.' },
  { q: 'Rewrite my CV for a Senior PM role.', a: 'Rephrased 18 bullet points with measurable outcomes and impact.' },
  { q: 'Practice an interview for Stripe Eng.', a: 'Started a mock loop · system design + behavioral, 45 min.' }
];

export function AISection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const visualY = useTransform(scrollYProgress, [0, 1], ['10%', '-10%']);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.9, 0.3]);

  return (
    <section ref={ref} className="relative py-section overflow-hidden">
      <motion.div
        style={{ opacity: glow }}
        className="absolute inset-0 -z-10 bg-grad-aurora animate-aurora"
      />

      <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
        <Reveal>
          <Badge variant="accent" dot><Sparkles size={11} /> WORK AI</Badge>
          <h2 className="mt-5 font-display text-4xl md:text-5xl tracking-tighter">
            Your <span className="gradient-text">career copilot</span>,
            available 24 / 7.
          </h2>
          <p className="mt-5 text-muted text-lg">
            Ask anything. Match jobs, rewrite your CV, prepare interviews,
            negotiate offers. Built on the latest frontier models.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              'Real-time job matching with vector search',
              'CV rewrite with measurable outcomes',
              'Mock interviews with scoring',
              'Salary negotiation playbooks'
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 size-1.5 rounded-full bg-accent shadow-glow" />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>

        <motion.div style={{ y: visualY }} className="relative">
          <div className="glass-strong rounded-3xl p-5 space-y-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2"
              >
                <div className="self-end ml-12 bg-grad-accent text-accent-fg text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 inline-block">
                  {s.q}
                </div>
                <div className="bg-surface-2 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block mr-12">
                  <span className="inline-flex items-center gap-2 text-2xs text-muted mb-1">
                    <Sparkles size={11} className="text-accent" /> WORK AI
                  </span>
                  <p>{s.a}</p>
                </div>
              </motion.div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Sparkles size={14} className="text-accent" />
              <input
                disabled placeholder="Ask WORK AI anything…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <kbd className="text-2xs text-muted px-1.5 py-0.5 rounded border border-border">⏎</kbd>
            </div>
          </div>

          {/* Floating particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute size-2 rounded-full bg-accent/40 shadow-glow"
              style={{ left: `${10 + i * 14}%`, top: `${i % 2 === 0 ? -20 : 110}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
