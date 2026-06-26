'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  ArrowUpRight, ArrowRight, ArrowDown, Sparkles, Heart, MessageCircle, Repeat2,
  Bookmark, Search, Bell, Building2, MapPin, Globe2, CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { HeroSceneClient } from './HeroSceneClient';
import { AlgeriaMap } from './AlgeriaMap';

const EASE = [0.16, 1, 0.3, 1] as const;
const rise = (d = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, delay: d, ease: EASE }
});

export function LandingPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  useEffect(() => { if (token) router.replace('/home'); }, [token, router]);

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-bg text-fg [--rule:color-mix(in_oklch,var(--fg)_12%,transparent)]">
      <Grain />
      <Nav />
      <Hero />
      <Ticker />
      <Capabilities />
      <Algeria />
      <JobsEditorial />
      <Metrics />
      <Closing />
      <Footer />
    </div>
  );
}

/* ───────── grain texture ───────── */
function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
      }}
    />
  );
}

/* ───────── nav ───────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 16);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'border-b border-[var(--rule)] bg-bg/70 backdrop-blur-xl' : 'border-b border-transparent'}`}>
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-[8px] bg-fg text-bg transition-transform duration-500 group-hover:rotate-[-8deg]">
            <span className="font-display text-sm font-semibold leading-none">W</span>
          </span>
          <span className="font-display text-[1.35rem] font-medium leading-none tracking-tight">WORK</span>
        </Link>
        <div className="ml-2 hidden items-center gap-7 md:flex">
          {[['Platform', '#platform'], ['Algeria', '#algeria'], ['Jobs', '#jobs']].map(([l, h]) => (
            <a key={l} href={h} className="text-[0.8rem] font-medium tracking-tight text-muted transition-colors hover:text-fg">{l}</a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className="rounded-full px-4 py-2 text-[0.8rem] font-medium text-fg transition-colors hover:bg-surface">Sign in</Link>
          <Link href="/register" className="inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-[0.8rem] font-medium text-bg transition-opacity hover:opacity-90">
            Join free <ArrowUpRight size={14} />
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ───────── hero ───────── */
const ROTATING = ['careers', 'talent', 'futures', 'ambition'];

function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ROTATING.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden border-b border-[var(--rule)] pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-90 [mask-image:radial-gradient(80%_75%_at_72%_35%,black,transparent)]">
        <HeroSceneClient />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{ background: 'radial-gradient(50% 45% at 85% 0%, color-mix(in oklch, var(--accent) 18%, transparent), transparent 70%)' }} />

      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div className="relative z-10 flex flex-col">
          <motion.div {...rise(0)} className="flex items-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
            <span style={{ color: 'var(--accent)' }}>(01)</span>
            <span className="h-px w-8 bg-[var(--rule)]" />
            The career operating system
          </motion.div>

          <h1 className="mt-7 font-display font-light leading-[0.9] tracking-[-0.035em]"
            style={{ fontSize: 'clamp(3rem, 1.2rem + 7vw, 7.5rem)' }}>
            <motion.span {...rise(0.05)} className="block">Where</motion.span>
            <span className="relative block h-[1.05em] overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={ROTATING[i]}
                  initial={{ y: '110%', opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: '-110%', opacity: 0, filter: 'blur(8px)' }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="absolute inset-0 italic"
                  style={{ color: 'var(--accent)' }}
                >
                  {ROTATING[i]}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.span {...rise(0.1)} className="block">take shape<span className="text-muted">.</span></motion.span>
          </h1>

          <motion.p {...rise(0.2)} className="mt-8 max-w-[44ch] text-[1.05rem] leading-relaxed text-muted">
            A recruitment platform, a social network, a student ecosystem and an AI
            career mentor — woven into one immersive workspace. Built in Algiers.
          </motion.p>

          <motion.div {...rise(0.28)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-fg px-7 py-3.5 text-[0.95rem] font-medium text-bg transition-opacity hover:opacity-90">
              Start free <ArrowRight size={16} />
            </Link>
            <Link href="/jobs" className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] px-7 py-3.5 text-[0.95rem] font-medium transition-colors hover:bg-surface">
              Explore jobs
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: 1.4 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
          className="relative z-10 hidden lg:block"
        >
          <FloatingCard />
        </motion.div>
      </div>

      <ScrollCue />
    </section>
  );
}

function FloatingCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-bg-elev/90 backdrop-blur-md shadow-[0_40px_100px_-40px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:rotate-0">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <div className="ml-3 flex flex-1 items-center gap-2 rounded-full border border-[var(--rule)] bg-surface px-3 py-1.5 text-[0.72rem] text-muted">
          <Search size={12} /> Search…
        </div>
        <Bell size={15} className="text-muted" />
      </div>
      <div className="space-y-3 p-4">
        <article className="rounded-xl border border-[var(--rule)] bg-surface p-4">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-grad-accent" />
            <div>
              <p className="flex items-center gap-1 text-sm font-medium">Sara Bouali <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} /></p>
              <p className="text-[0.7rem] text-muted">Senior Product Designer · 2h</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed">Shipped our onboarding — activation up 38%. Hiring 2 design engineers. 🚀</p>
          <div className="mt-3 flex gap-5 text-muted">
            <span className="flex items-center gap-1 text-xs"><Heart size={14} /> 1.2k</span>
            <span className="flex items-center gap-1 text-xs"><MessageCircle size={14} /> 142</span>
            <span className="flex items-center gap-1 text-xs"><Repeat2 size={14} /> 86</span>
            <Bookmark size={14} className="ml-auto" />
          </div>
        </article>
        <article className="rounded-xl border border-[var(--rule)] bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--rule)] bg-bg-elev"><Building2 size={18} className="text-muted" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Product Engineer</p>
                <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium" style={{ background: 'color-mix(in oklch, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>96% match</span>
              </div>
              <p className="text-xs text-muted">Stripe · Remote · $220–280k</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function ScrollCue() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted"
    >
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em]">Scroll</span>
      <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        <ArrowDown size={14} />
      </motion.span>
    </motion.div>
  );
}

/* ───────── ticker ───────── */
function Ticker() {
  const items = ['Frontend Engineer', 'Product Designer', 'ML Engineer', 'Growth Lead', 'iOS Developer', 'Data Scientist', 'Brand Designer', 'Founding Engineer', 'DevRel', 'Researcher'];
  const row = [...items, ...items];
  return (
    <section className="overflow-hidden border-b border-[var(--rule)] py-5">
      <div className="flex w-max animate-[marqueeX_38s_linear_infinite] gap-3 pr-3">
        {row.map((t, i) => (
          <span key={i} className="whitespace-nowrap rounded-full border border-[var(--rule)] px-4 py-1.5 text-sm text-muted">{t}</span>
        ))}
      </div>
      <style jsx>{`@keyframes marqueeX { to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

/* ───────── capabilities — pinned scroll-telling ───────── */
const CAPS = [
  { n: '01', t: 'Jobs that find you', d: 'AI ranks live roles by your skills, salary and ambitions. One-click apply, tracked end to end.', href: '/jobs' },
  { n: '02', t: 'A social feed that matters', d: 'Post, follow, comment, repost. LinkedIn substance with the fluidity of X.', href: '/feed' },
  { n: '03', t: 'Communities, reimagined', d: 'Discord-style spaces — channels, roles, events, real-time chat, moderation.', href: '/communities' },
  { n: '04', t: 'Your AI career mentor', d: 'Coach, CV analyzer, roadmap generator, mock interviews. Always on. Always tailored.', href: '/ai' }
];

function Capabilities() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.max(0, Math.min(CAPS.length - 1, Math.floor(v * CAPS.length))));
  });

  return (
    // Pinned scroll-telling on desktop; a calm stacked list on mobile (no
    // endless empty scroll under the thumb).
    <section id="platform" ref={ref} className="relative lg:h-[340vh]">
      <div className="flex items-center py-20 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden lg:py-0">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* sticky giant index */}
          <div className="hidden lg:block">
            <Label index="02" text="The platform" />
            <div className="relative mt-8 h-[40vh]">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={CAPS[active].n}
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="absolute inset-0"
                >
                  <p className="font-display font-light leading-none text-fg/[0.08]" style={{ fontSize: 'clamp(8rem, 18vw, 16rem)' }}>{CAPS[active].n}</p>
                  <p className="mt-2 max-w-[40ch] text-lg leading-relaxed text-muted">{CAPS[active].d}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* list */}
          <div className="flex flex-col gap-2">
            <h2 className="mb-6 font-display font-light leading-[0.95] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.2rem, 1.2rem + 3.5vw, 4rem)' }}>
              One workspace.<br /><span className="italic text-muted">Everything</span> your career needs.
            </h2>
            {CAPS.map((c, idx) => (
              <a key={c.n} href={c.href}
                className={`group flex items-start gap-5 rounded-2xl border border-transparent p-4 transition-all duration-500 ${active === idx ? 'border-[var(--rule)] bg-surface/50' : 'opacity-50 hover:opacity-100'}`}>
                <span className="pt-1.5 font-mono text-xs" style={{ color: active === idx ? 'var(--accent)' : 'var(--muted)' }}>{c.n}</span>
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-medium tracking-tight transition-colors group-hover:text-accent">{c.t}</h3>
                  <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-muted lg:hidden">{c.d}</p>
                </div>
                <ArrowUpRight size={20} className="mt-2 shrink-0 text-muted transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fg" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── algeria ───────── */
function Algeria() {
  return (
    <section id="algeria" className="border-y border-[var(--rule)] bg-surface/30">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-32">
        <div>
          <Label index="03" text="Built in Algeria" />
          <motion.h2 {...rise(0.05)} className="mt-7 font-display font-light leading-[0.95] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.2rem, 1.2rem + 3.5vw, 4.2rem)' }}>
            A network for <span className="italic" style={{ color: 'var(--accent)' }}>Algerian</span> talent.
          </motion.h2>
          <motion.p {...rise(0.12)} className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">
            From Alger to Tamanrasset — students, freelancers, engineers and founders,
            connected on one platform. Local opportunities, global standards. WORK is
            built here, for the people building Algeria's future.
          </motion.p>
          <motion.div {...rise(0.18)} className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--rule)] pt-7">
            {[['58', 'wilayas covered'], ['9+', 'major hubs'], ['100%', 'in Arabic, FR & EN']].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl font-medium tracking-tight">{n}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-muted">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div {...rise(0.1)} className="relative mx-auto aspect-square w-full max-w-[460px]">
          <AlgeriaMap />
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── jobs ───────── */
function JobsEditorial() {
  const jobs = [
    { title: 'Product Engineer', company: 'Stripe', loc: 'Remote', salary: '$220–280k', match: 96, remote: true },
    { title: 'Design Engineer', company: 'Linear', loc: 'San Francisco', salary: '$190–240k', match: 94, remote: false },
    { title: 'Founding Engineer', company: 'Vercel', loc: 'NYC · Hybrid', salary: '$240–320k', match: 92, remote: false },
    { title: 'Staff ML Engineer', company: 'Anthropic', loc: 'Remote', salary: '$330–420k', match: 89, remote: true },
    { title: 'Brand Designer', company: 'Framer', loc: 'Amsterdam', salary: '€90–130k', match: 84, remote: false }
  ];
  return (
    <section id="jobs" className="border-b border-[var(--rule)]">
      <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Label index="04" text="Trending this week" />
            <motion.h2 {...rise(0.05)} className="mt-6 font-display font-light tracking-[-0.03em]" style={{ fontSize: 'clamp(2rem, 1.2rem + 3vw, 3.4rem)' }}>
              Roles ranked <span className="italic">for you</span>.
            </motion.h2>
          </div>
          <Link href="/jobs" className="hidden shrink-0 items-center gap-1.5 text-sm text-accent hover:underline sm:inline-flex">All jobs <ArrowRight size={14} /></Link>
        </div>
        <div className="mt-10 border-t border-[var(--rule)]">
          {jobs.map((j, i) => (
            <motion.div key={j.title} {...rise(i * 0.05)}
              className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--rule)] py-5 transition-colors hover:bg-surface/50 sm:grid-cols-[2fr_1.4fr_1fr_auto] sm:px-2">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--rule)] bg-bg-elev"><Building2 size={15} className="text-muted" /></span>
                <div>
                  <p className="font-display text-lg font-medium tracking-tight">{j.title}</p>
                  <p className="text-xs text-muted sm:hidden">{j.company} · {j.salary}</p>
                </div>
              </div>
              <p className="hidden text-sm text-muted sm:block">{j.company}</p>
              <p className="hidden items-center gap-1.5 text-sm text-muted sm:flex">{j.remote ? <Globe2 size={13} /> : <MapPin size={13} />} {j.loc}</p>
              <div className="flex items-center justify-end gap-3">
                <span className="font-display text-base font-medium tracking-tight" style={{ color: 'var(--accent)' }}>{j.match}%</span>
                <span className="hidden text-sm font-medium sm:inline">{j.salary}</span>
                <ArrowUpRight size={18} className="text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── metrics ───────── */
function Metrics() {
  const stats = [['12.4k', 'live roles'], ['240k', 'members'], ['96%', 'avg match'], ['24/7', 'AI mentor']];
  return (
    <section className="border-b border-[var(--rule)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-px overflow-hidden bg-[var(--rule)] sm:grid-cols-4">
        {stats.map(([n, l], i) => (
          <motion.div key={l} {...rise(i * 0.08)} className="bg-bg px-6 py-14 text-center">
            <p className="font-display font-light tracking-tight" style={{ fontSize: 'clamp(2.5rem, 1rem + 5vw, 4.5rem)' }}>{n}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{l}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────── closing ───────── */
function Closing() {
  return (
    <section className="relative mx-auto max-w-[1280px] px-5 py-28 sm:px-8 lg:py-40">
      <motion.div {...rise()} className="text-center">
        <Label index="05" text="Get started" center />
        <h2 className="mx-auto mt-7 max-w-[16ch] font-display font-light leading-[0.92] tracking-[-0.035em]" style={{ fontSize: 'clamp(2.6rem, 1.2rem + 6vw, 7rem)' }}>
          The work of <span className="italic" style={{ color: 'var(--accent)' }}>your life</span> starts here.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-fg px-8 py-4 text-base font-medium text-bg transition-opacity hover:opacity-90">
            Create your account <ArrowRight size={17} />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] px-8 py-4 text-base font-medium transition-colors hover:bg-surface">Sign in</Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ───────── footer ───────── */
function Footer() {
  const cols = [
    { t: 'Product', l: ['Jobs', 'Feed', 'Communities', 'AI Studio', 'CV Builder'] },
    { t: 'Company', l: ['About', 'Careers', 'Press', 'Brand'] },
    { t: 'Resources', l: ['Help', 'Blog', 'API', 'Status'] },
    { t: 'Legal', l: ['Privacy', 'Terms', 'Security'] }
  ];
  return (
    <footer className="border-t border-[var(--rule)]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-[7px] bg-fg text-bg"><span className="font-display text-sm font-semibold leading-none">W</span></span>
            <span className="font-display text-xl font-medium tracking-tight">WORK</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">The career operating system for the next generation. Built in Algiers, for the world.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">{c.t}</p>
            <ul className="mt-4 space-y-2.5">{c.l.map((x) => <li key={x}><a href="#" className="text-sm text-muted transition-colors hover:text-fg">{x}</a></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="overflow-hidden border-t border-[var(--rule)]">
        <p className="select-none px-5 py-8 text-center font-display font-light leading-none tracking-[-0.04em] text-fg/[0.06]" style={{ fontSize: 'clamp(4rem, 18vw, 16rem)' }}>WORK</p>
      </div>
      <div className="border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} WORK. All rights reserved.</p>
          <p>Crafted in Algiers 🇩🇿 · Built for the world.</p>
        </div>
      </div>
    </footer>
  );
}

/* ───────── shared ───────── */
function Label({ index, text, center }: { index: string; text: string; center?: boolean }) {
  return (
    <motion.div {...rise()} className={`flex items-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted ${center ? 'justify-center' : ''}`}>
      <span style={{ color: 'var(--accent)' }}>({index})</span>
      <span className="h-px w-8 bg-[var(--rule)]" />
      {text}
    </motion.div>
  );
}

