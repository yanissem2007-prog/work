'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowRight, CheckCircle2, Heart, MessageCircle, Repeat2,
  Bookmark, Search, Bell, Building2, MapPin, Globe2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';

const rise = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, delay: d, ease: [0.16, 1, 0.3, 1] as const }
});

export function LandingPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  useEffect(() => { if (token) router.replace('/home'); }, [token, router]);

  return (
    <div className="min-h-dvh bg-bg text-fg [--rule:color-mix(in_oklch,var(--fg)_12%,transparent)]">
      <Nav />
      <Hero />
      <Ticker />
      <Capabilities />
      <JobsEditorial />
      <Closing />
      <Footer />
    </div>
  );
}

/* ───────────────────── Nav ───────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center gap-8 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-[7px] bg-fg text-bg">
            <span className="font-display text-sm font-semibold leading-none">W</span>
          </span>
          <span className="font-display text-[1.35rem] font-medium leading-none tracking-tight">WORK</span>
        </Link>

        <div className="ml-2 hidden items-center gap-7 md:flex">
          {[['Jobs', '#jobs'], ['Platform', '#platform'], ['Communities', '#platform'], ['AI', '#platform']].map(
            ([l, h]) => (
              <a key={l} href={h}
                className="text-[0.8rem] font-medium tracking-tight text-muted transition-colors hover:text-fg">
                {l}
              </a>
            )
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login"
            className="rounded-full px-4 py-2 text-[0.8rem] font-medium text-fg transition-colors hover:bg-surface">
            Sign in
          </Link>
          <Link href="/register"
            className="group inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-[0.8rem] font-medium text-bg transition hover:opacity-90">
            Join free
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ───────────────────── Hero ───────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--rule)]">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
        style={{ background: 'radial-gradient(48% 40% at 88% -5%, color-mix(in oklch, var(--accent) 16%, transparent), transparent 70%)' }} />

      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col">
          <Label index="01" text="Professional network · jobs · AI" />

          <motion.h1 {...rise(0.05)}
            className="mt-7 font-display font-light leading-[0.92] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(2.85rem, 1.4rem + 6vw, 6.5rem)' }}>
            Where careers
            <br />
            <span className="italic" style={{ color: 'var(--accent)' }}>take shape</span>
            <span className="text-muted">.</span>
          </motion.h1>

          <motion.p {...rise(0.12)}
            className="mt-7 max-w-[42ch] text-[1.05rem] leading-relaxed text-muted">
            A recruitment platform, a social network, a student ecosystem and an
            AI career assistant — woven into one immersive workspace.
          </motion.p>

          <motion.div {...rise(0.18)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-fg px-7 py-3.5 text-[0.95rem] font-medium text-bg transition hover:-translate-y-0.5">
              Start free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] px-7 py-3.5 text-[0.95rem] font-medium transition hover:bg-surface">
              Explore jobs
            </Link>
          </motion.div>

          <motion.div {...rise(0.24)} className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--rule)] pt-7">
            {[['12.4k', 'live roles'], ['240k', 'members'], ['96%', 'avg match']].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl font-medium tracking-tight">{n}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-muted">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div {...rise(0.15)} className="relative lg:pl-6">
          <div className="lg:rotate-[1.4deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0">
            <ProductPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-bg-elev shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <div className="ml-3 flex flex-1 items-center gap-2 rounded-full border border-[var(--rule)] bg-surface px-3 py-1.5 text-[0.72rem] text-muted">
          <Search size={12} /> Search people, jobs, communities…
        </div>
        <Bell size={15} className="text-muted" />
      </div>

      <div className="space-y-3 p-4">
        <article className="rounded-xl border border-[var(--rule)] bg-surface p-4">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-grad-accent" />
            <div>
              <p className="flex items-center gap-1 text-sm font-medium">
                Sara Bouali <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />
              </p>
              <p className="text-[0.7rem] text-muted">Senior Product Designer · 2h</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            Shipped our new onboarding — activation up 38%. Hiring 2 design engineers. 🚀
          </p>
          <div className="mt-3 flex gap-5 text-muted">
            <span className="flex items-center gap-1 text-xs"><Heart size={14} /> 1.2k</span>
            <span className="flex items-center gap-1 text-xs"><MessageCircle size={14} /> 142</span>
            <span className="flex items-center gap-1 text-xs"><Repeat2 size={14} /> 86</span>
            <Bookmark size={14} className="ml-auto" />
          </div>
        </article>

        <article className="rounded-xl border border-[var(--rule)] bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--rule)] bg-bg-elev">
              <Building2 size={18} className="text-muted" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Senior Frontend Engineer</p>
                <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
                  style={{ background: 'color-mix(in oklch, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
                  96% match
                </span>
              </div>
              <p className="text-xs text-muted">Stripe · Remote · $220–280k</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['React', 'TypeScript', 'GraphQL'].map((t) => (
                  <span key={t} className="rounded-md bg-bg-elev px-1.5 py-0.5 text-[0.65rem] text-muted">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

/* ───────────────────── Ticker ───────────────────── */
function Ticker() {
  const items = ['Frontend Engineer', 'Product Designer', 'ML Engineer', 'Growth Lead', 'iOS Developer',
    'Data Scientist', 'Brand Designer', 'Founding Engineer', 'DevRel', 'Researcher'];
  const row = [...items, ...items];
  return (
    <section className="overflow-hidden border-b border-[var(--rule)] py-5">
      <div className="flex w-max animate-[marqueeX_38s_linear_infinite] gap-3 pr-3">
        {row.map((t, i) => (
          <span key={i}
            className="whitespace-nowrap rounded-full border border-[var(--rule)] px-4 py-1.5 text-sm text-muted">
            {t}
          </span>
        ))}
      </div>
      <style jsx>{`@keyframes marqueeX { to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

/* ───────────────────── Capabilities ───────────────────── */
function Capabilities() {
  const rows = [
    { n: '01', t: 'Jobs that find you', d: 'AI ranks 200k+ roles by your skills, salary and ambitions. One-click apply, tracked end to end.', href: '/jobs' },
    { n: '02', t: 'A social feed that matters', d: 'Post, follow, comment, repost. LinkedIn substance with the fluidity of X.', href: '/feed' },
    { n: '03', t: 'Communities, reimagined', d: 'Discord-style spaces — channels, roles, events, real-time chat, moderation.', href: '/communities' },
    { n: '04', t: 'Your AI career copilot', d: 'Coach, CV analyzer, roadmap generator, mock interviews. Available 24/7.', href: '/coach' }
  ];
  return (
    <section id="platform" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Label index="02" text="The platform" />
          <motion.h2 {...rise(0.05)}
            className="mt-6 font-display font-light leading-[0.95] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(2.2rem, 1.2rem + 3.5vw, 4rem)' }}>
            One workspace.<br /><span className="italic text-muted">Everything</span> your<br />career needs.
          </motion.h2>
        </div>

        <div className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {rows.map((r, i) => (
            <motion.a key={r.n} href={r.href} {...rise(i * 0.06)}
              className="group flex items-start gap-5 py-7 sm:gap-8">
              <span className="pt-2 font-mono text-xs text-muted">{r.n}</span>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-medium tracking-tight transition-colors group-hover:text-accent sm:text-[1.7rem]">
                  {r.t}
                </h3>
                <p className="mt-2 max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">{r.d}</p>
              </div>
              <ArrowUpRight size={22}
                className="mt-2 shrink-0 text-muted transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fg" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Jobs (editorial table) ───────────────────── */
function JobsEditorial() {
  const jobs = [
    { title: 'Product Engineer', company: 'Stripe', loc: 'Remote', salary: '$220–280k', match: 96, remote: true },
    { title: 'Design Engineer', company: 'Linear', loc: 'San Francisco', salary: '$190–240k', match: 94, remote: false },
    { title: 'Founding Engineer', company: 'Vercel', loc: 'NYC · Hybrid', salary: '$240–320k', match: 92, remote: false },
    { title: 'Staff ML Engineer', company: 'Anthropic', loc: 'Remote', salary: '$330–420k', match: 89, remote: true },
    { title: 'Brand Designer', company: 'Framer', loc: 'Amsterdam', salary: '€90–130k', match: 84, remote: false }
  ];
  return (
    <section id="jobs" className="border-y border-[var(--rule)] bg-surface/40">
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Label index="03" text="Trending this week" />
            <motion.h2 {...rise(0.05)}
              className="mt-6 font-display font-light tracking-[-0.03em]"
              style={{ fontSize: 'clamp(2rem, 1.2rem + 3vw, 3.4rem)' }}>
              Roles ranked <span className="italic">for you</span>.
            </motion.h2>
          </div>
          <Link href="/jobs" className="hidden shrink-0 items-center gap-1.5 text-sm text-accent hover:underline sm:inline-flex">
            All jobs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-10 border-t border-[var(--rule)]">
          {jobs.map((j, i) => (
            <motion.div key={j.title} {...rise(i * 0.05)}
              className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--rule)] py-5 transition-colors hover:bg-bg-elev/50 sm:grid-cols-[2fr_1.4fr_1fr_auto] sm:px-2">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--rule)] bg-bg-elev">
                  <Building2 size={15} className="text-muted" />
                </span>
                <div>
                  <p className="font-display text-lg font-medium tracking-tight">{j.title}</p>
                  <p className="text-xs text-muted sm:hidden">{j.company} · {j.salary}</p>
                </div>
              </div>
              <p className="hidden text-sm text-muted sm:block">{j.company}</p>
              <p className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
                {j.remote ? <Globe2 size={13} /> : <MapPin size={13} />} {j.loc}
              </p>
              <div className="flex items-center justify-end gap-3">
                <span className="font-display text-base font-medium tracking-tight" style={{ color: 'var(--accent)' }}>
                  {j.match}%
                </span>
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

/* ───────────────────── Closing ───────────────────── */
function Closing() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 lg:py-36">
      <motion.div {...rise()} className="text-center">
        <Label index="04" text="Get started" center />
        <h2 className="mx-auto mt-7 max-w-[16ch] font-display font-light leading-[0.95] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(2.6rem, 1.4rem + 5vw, 6rem)' }}>
          The work of <span className="italic" style={{ color: 'var(--accent)' }}>your life</span> starts here.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-fg px-8 py-4 text-base font-medium text-bg transition hover:-translate-y-0.5">
            Create your account
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] px-8 py-4 text-base font-medium transition hover:bg-surface">
            Sign in
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ───────────────────── Footer ───────────────────── */
function Footer() {
  const cols = [
    { t: 'Product', l: ['Jobs', 'Feed', 'Communities', 'AI Studio', 'CV Builder'] },
    { t: 'Company', l: ['About', 'Careers', 'Press', 'Brand'] },
    { t: 'Resources', l: ['Help', 'Blog', 'API', 'Status'] },
    { t: 'Legal', l: ['Privacy', 'Terms', 'Security'] }
  ];
  return (
    <footer className="border-t border-[var(--rule)]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-[7px] bg-fg text-bg">
              <span className="font-display text-sm font-semibold leading-none">W</span>
            </span>
            <span className="font-display text-xl font-medium tracking-tight">WORK</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            The professional network for the next generation. Built in Algiers, for the world.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">{c.t}</p>
            <ul className="mt-4 space-y-2.5">
              {c.l.map((x) => (
                <li key={x}><a href="#" className="text-sm text-muted transition-colors hover:text-fg">{x}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="overflow-hidden border-t border-[var(--rule)]">
        <p className="select-none px-5 py-8 text-center font-display font-light leading-none tracking-[-0.04em] text-fg/[0.07]"
          style={{ fontSize: 'clamp(4rem, 18vw, 16rem)' }}>
          WORK
        </p>
      </div>

      <div className="border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} WORK. All rights reserved.</p>
          <p>Crafted in Algiers · Built for the world.</p>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────── shared label ───────────────────── */
function Label({ index, text, center }: { index: string; text: string; center?: boolean }) {
  return (
    <motion.div {...rise()}
      className={`flex items-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted ${center ? 'justify-center' : ''}`}>
      <span style={{ color: 'var(--accent)' }}>({index})</span>
      <span className="h-px w-8 bg-[var(--rule)]" />
      {text}
    </motion.div>
  );
}
