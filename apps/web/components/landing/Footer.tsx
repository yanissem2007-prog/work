'use client';
import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { Magnetic } from '@/components/motion/Magnetic';

const COLS = [
  { title: 'Product', links: ['Feed', 'Jobs', 'AI Studio', 'CV Builder', 'Communities', 'Messaging'] },
  { title: 'Company', links: ['About', 'Careers', 'Press', 'Brand'] },
  { title: 'Resources', links: ['Help center', 'Blog', 'Changelog', 'API'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] }
];

export function Footer() {
  return (
    <footer className="relative pt-section pb-12 overflow-hidden">
      {/* Final cinematic CTA */}
      <Reveal className="relative mx-auto max-w-5xl px-6 mb-24 text-center">
        <h2 className="font-display text-5xl md:text-7xl tracking-tightest leading-[0.95]">
          The work of <br />
          <span className="gradient-text italic">your life</span> starts here.
        </h2>
        <div className="mt-10 flex justify-center gap-3">
          <Magnetic><Button variant="accent" size="xl" magnetic>Create your account</Button></Magnetic>
          <Button variant="glass" size="xl" asChild><Link href="/login">Sign in</Link></Button>
        </div>
      </Reveal>

      {/* Giant wordmark */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="font-display text-[28vw] md:text-[20vw] leading-none tracking-tightest text-fg-soft/8 select-none pointer-events-none">
          WORK
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 -mt-8 relative">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-10 pb-10 border-t border-border pt-14">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-display text-lg">
              <span className="inline-block size-6 rounded-md bg-grad-accent shadow-glow" />
              WORK
            </div>
            <p className="mt-4 text-sm text-muted max-w-xs">
              The professional network for the next generation.
              Built in Algiers, for the world.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="glass" size="icon" aria-label="Twitter"><Twitter size={16} /></Button>
              <Button variant="glass" size="icon" aria-label="GitHub"><Github size={16} /></Button>
              <Button variant="glass" size="icon" aria-label="LinkedIn"><Linkedin size={16} /></Button>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-eyebrow mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted hover:text-fg transition-colors duration-fast">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-border text-2xs text-muted">
          <p>© {new Date().getFullYear()} WORK. All rights reserved.</p>
          <p>Crafted in Algiers · Built for the world.</p>
        </div>
      </div>
    </footer>
  );
}
