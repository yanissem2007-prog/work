'use client';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/Reveal';

const UNIS = [
  'USTHB', 'ENP Algiers', 'École Polytechnique', 'MIT', 'Stanford',
  'Oxford', 'EPFL', 'Tsinghua', 'Sorbonne', 'TU Delft'
];

export function Universities() {
  return (
    <section className="relative py-section border-y border-border overflow-hidden">
      <Reveal className="text-center max-w-2xl mx-auto px-6 mb-10">
        <p className="text-eyebrow mb-3">Students & alumni from</p>
        <h2 className="font-display text-3xl md:text-4xl tracking-tighter">
          Built for the next generation.
        </h2>
      </Reveal>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

        <div className="flex overflow-hidden">
          <motion.div
            className="flex shrink-0 gap-10 pr-10 items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 35, ease: 'linear', repeat: Infinity }}
          >
            {[...UNIS, ...UNIS].map((u, i) => (
              <div key={i} className="glass rounded-pill px-6 py-3 text-sm font-medium whitespace-nowrap">
                {u}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
