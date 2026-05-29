'use client';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/Reveal';

const COMPANIES = [
  'Stripe', 'Linear', 'Vercel', 'Notion', 'Figma', 'Arc', 'Anthropic',
  'OpenAI', 'GitHub', 'Shopify', 'Airbnb', 'Discord', 'Framer', 'Apple'
];

export function CompaniesTicker() {
  return (
    <section className="relative py-24 border-y border-border overflow-hidden">
      <Reveal className="text-center mb-10">
        <p className="text-eyebrow">Trusted by talent from</p>
      </Reveal>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

        <Track reverse={false} />
        <Track reverse={true} className="mt-6 opacity-60" />
      </div>
    </section>
  );
}

function Track({ reverse, className }: { reverse: boolean; className?: string }) {
  return (
    <div className={`flex overflow-hidden ${className ?? ''}`}>
      <motion.div
        className="flex shrink-0 gap-12 pr-12 items-center"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
      >
        {[...COMPANIES, ...COMPANIES].map((c, i) => (
          <span
            key={i}
            className="font-display text-3xl md:text-5xl tracking-tighter text-fg-soft/60 hover:text-fg transition-colors duration-normal whitespace-nowrap"
          >
            {c}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
