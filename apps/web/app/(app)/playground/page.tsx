'use client';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
import {
  TiltCard, SpotlightCard, LiquidButton, Marquee, AnimatedNumber,
  Reveal, Stagger, StaggerItem, Parallax, GlowEdge, MagneticLink, AnimatedGradient
} from '@/components/micro';
import { Card } from '@/components/ui/Card';

export default function PlaygroundPage() {
  return (
    <div className="space-y-12">
      <header>
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Sparkles size={11} /> Micro-interaction playground
        </div>
        <h1 className="mt-3 font-display text-5xl tracking-tightest">
          Every <span className="gradient-text italic">primitive</span>, on one page.
        </h1>
      </header>

      <Section title="TiltCard">
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <TiltCard key={i} className="rounded-2xl">
              <Card variant="glass" className="aspect-[5/4] flex items-center justify-center">
                <p className="font-display text-3xl tracking-tighter">Tilt #{i}</p>
              </Card>
            </TiltCard>
          ))}
        </div>
      </Section>

      <Section title="SpotlightCard">
        <div className="grid sm:grid-cols-2 gap-4">
          <SpotlightCard className="rounded-2xl glass p-8" color="oklch(72% 0.2 264)">
            <p className="font-display text-2xl tracking-tighter">Move your cursor.</p>
            <p className="text-sm text-muted mt-1">The light follows. Zero re-renders.</p>
          </SpotlightCard>
          <SpotlightCard className="rounded-2xl glass p-8" color="oklch(70% 0.24 340)">
            <p className="font-display text-2xl tracking-tighter">Premium hover.</p>
            <p className="text-sm text-muted mt-1">Pair it with TiltCard for max polish.</p>
          </SpotlightCard>
        </div>
      </Section>

      <Section title="LiquidButton + MagneticLink">
        <div className="flex flex-wrap gap-4 items-center">
          <MagneticLink>
            <LiquidButton>
              <Sparkles size={14} /> Get started <ArrowRight size={14} />
            </LiquidButton>
          </MagneticLink>
          <MagneticLink strength={0.5}>
            <LiquidButton className="!bg-fg !text-bg shadow-none">
              Strong pull
            </LiquidButton>
          </MagneticLink>
        </div>
      </Section>

      <Section title="AnimatedNumber">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card variant="glass" className="text-center">
            <p className="text-2xs uppercase tracking-caps text-muted">Active users</p>
            <p className="mt-2 font-display text-5xl tracking-tightest tabular-nums">
              <AnimatedNumber value={241_823} />
            </p>
          </Card>
          <Card variant="glass" className="text-center">
            <p className="text-2xs uppercase tracking-caps text-muted">Match score</p>
            <p className="mt-2 font-display text-5xl tracking-tightest tabular-nums gradient-text">
              <AnimatedNumber value={94} />%
            </p>
          </Card>
          <Card variant="glass" className="text-center">
            <p className="text-2xs uppercase tracking-caps text-muted">Revenue</p>
            <p className="mt-2 font-display text-5xl tracking-tightest tabular-nums">
              $<AnimatedNumber value={2_400_000} />
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Marquee">
        <Marquee
          items={['Stripe', 'Linear', 'Vercel', 'Notion', 'Figma', 'Arc', 'Anthropic', 'OpenAI', 'Apple', 'Framer'].map((s) => (
            <span className="font-display text-3xl tracking-tighter text-fg-soft/60">{s}</span>
          ))}
          speed={70}
        />
      </Section>

      <Section title="GlowEdge">
        <div className="flex gap-4">
          <GlowEdge className="rounded-2xl">
            <Card variant="glass" className="!p-6 w-64">
              <p className="text-eyebrow">Pro</p>
              <p className="mt-2 font-display text-3xl tracking-tightest">$24<span className="text-base text-muted">/mo</span></p>
            </Card>
          </GlowEdge>
          <GlowEdge className="rounded-2xl" color="oklch(78% 0.22 142)">
            <Card variant="glass" className="!p-6 w-64">
              <p className="text-eyebrow text-success">Recommended</p>
              <p className="mt-2 font-display text-3xl tracking-tightest">$48<span className="text-base text-muted">/mo</span></p>
            </Card>
          </GlowEdge>
        </div>
      </Section>

      <Section title="Reveal + Stagger">
        <Stagger className="grid sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StaggerItem key={i}>
              <Card variant="glass" className="text-center">
                <Heart size={16} className="mx-auto text-accent mb-2" />
                <p className="text-sm font-medium">Item {i}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section title="Parallax">
        <div className="relative h-96 rounded-3xl border border-border overflow-hidden">
          <AnimatedGradient className="-z-10" />
          <Parallax range={120} className="absolute inset-0 grid place-items-center">
            <p className="font-display text-6xl tracking-tightest">Floats with scroll</p>
          </Parallax>
        </div>
      </Section>

      <Section title="AnimatedGradient (background)">
        <div className="relative h-64 rounded-3xl border border-border overflow-hidden grid place-items-center">
          <AnimatedGradient className="-z-10" />
          <p className="font-display text-3xl tracking-tighter">Drifts forever, costs nothing</p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <Reveal>
        <h2 className="font-display text-2xl tracking-tighter">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}
