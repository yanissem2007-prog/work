'use client';
import { useState } from 'react';
import { ArrowRight, Sparkles, Search, Mail, Lock } from 'lucide-react';
import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardFooter,
  Input, FloatingInput, Textarea, Modal, Badge, Avatar, Skeleton, Spinner,
  ThemeToggle
} from '@/components/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';
import { FloatingCard } from '@/components/motion/FloatingCard';
import { TextReveal } from '@/components/motion/TextReveal';

export default function DesignPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="relative min-h-dvh">
      {/* Aurora backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 mesh aurora opacity-70 animate-aurora" />
      <div className="pointer-events-none fixed inset-0 -z-10 noise" />

      <header className="mx-auto max-w-6xl px-6 pt-24 pb-12">
        <Badge variant="glass" dot dotColor="var(--accent)">Design System v1</Badge>
        <h1 className="mt-6 font-display text-hero tracking-tightest">
          <TextReveal text="A premium, cinematic" />
          <br />
          <span className="gradient-text"><TextReveal text="interface language." delay={0.25} /></span>
        </h1>
        <Reveal delay={0.6} className="mt-6 max-w-xl text-lg text-muted">
          Tokens, glass surfaces, motion, and primitives crafted for WORK.
        </Reveal>
        <Reveal delay={0.8} className="mt-8 flex flex-wrap gap-3">
          <Magnetic><Button variant="accent" size="lg" magnetic>Get started <ArrowRight size={16} /></Button></Magnetic>
          <Button variant="glass" size="lg">View components</Button>
          <ThemeToggle />
        </Reveal>
      </header>

      <Section title="Typography">
        <div className="space-y-4">
          <p className="text-display font-display leading-none tracking-tightest">Display</p>
          <p className="text-hero font-display tracking-tighter">Hero typography</p>
          <p className="text-3xl font-display tracking-snug">3xl heading sample</p>
          <p className="text-xl">Body large — readable at any scale.</p>
          <p className="text-base text-muted">Body base — defaults to muted for secondary copy.</p>
          <p className="text-eyebrow">EYEBROW · CAPS</p>
        </div>
      </Section>

      <Section title="Color · Light + Dark">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['bg','surface','surface-2','fg','accent','violet','cyan','magenta','lime','success','warning','danger'].map((c) => (
            <div key={c} className="rounded-xl p-4 border border-border" style={{ background: `var(--${c})` }}>
              <span className="text-xs font-mono mix-blend-difference text-white">--{c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Glass & Surfaces">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card variant="glass" tilt glow><CardTitle>Glass</CardTitle><CardDescription className="mt-2">Backdrop blur + frost border.</CardDescription></Card>
          <Card variant="frost" tilt glow><CardTitle>Frost</CardTitle><CardDescription className="mt-2">Heavier blur, opaque feel.</CardDescription></Card>
          <Card variant="gradient" tilt glow><CardTitle>Mesh</CardTitle><CardDescription className="mt-2">Subtle radial mesh gradient.</CardDescription></Card>
        </div>
      </Section>

      <Section title="Buttons">
        <Stagger className="flex flex-wrap gap-3">
          {(['primary','accent','glass','outline','ghost','danger','link'] as const).map((v) => (
            <StaggerItem key={v}><Button variant={v}>{v}</Button></StaggerItem>
          ))}
          <StaggerItem><Button variant="accent" magnetic size="lg" shine>Magnetic + shine</Button></StaggerItem>
          <StaggerItem><Button variant="primary" loading>Loading</Button></StaggerItem>
          <StaggerItem><Button variant="glass" size="icon"><Sparkles size={16} /></Button></StaggerItem>
        </Stagger>
      </Section>

      <Section title="Cards">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card variant="surface" interactive tilt glow className="group">
            <CardHeader>
              <Badge variant="accent">New</Badge>
              <CardTitle>Senior Engineer</CardTitle>
              <CardDescription>Stripe · Remote</CardDescription>
            </CardHeader>
            <CardFooter><span className="text-sm text-muted">$180k–$240k</span><Button size="sm">Apply</Button></CardFooter>
          </Card>
          <FloatingCard>
            <Card variant="glass">
              <CardTitle>Floating card</CardTitle>
              <CardDescription className="mt-2">Subtle 6s float — feels alive.</CardDescription>
            </Card>
          </FloatingCard>
          <Card variant="gradient" tilt glow>
            <CardTitle className="gradient-text">Gradient mesh</CardTitle>
            <CardDescription className="mt-2">Aurora gradient on a glass card.</CardDescription>
          </Card>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <Input label="Email" placeholder="you@work.app" leading={<Mail size={16} />} />
          <Input label="Password" placeholder="•••••••" type="password" leading={<Lock size={16} />} error="At least 8 characters" />
          <FloatingInput label="Full name" />
          <Input variant="glass" placeholder="Search jobs…" leading={<Search size={16} />} />
          <Textarea placeholder="Write something thoughtful…" className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Modal">
        <Button variant="accent" magnetic onClick={() => setOpen(true)}>Open modal</Button>
        <Modal open={open} onOpenChange={setOpen} title="Welcome to WORK" description="Sign in to continue your career journey." size="md">
          <div className="space-y-3">
            <Input label="Email" leading={<Mail size={16} />} />
            <Input label="Password" type="password" leading={<Lock size={16} />} />
            <Button variant="accent" className="w-full">Continue</Button>
          </div>
        </Modal>
      </Section>

      <Section title="Badges & Avatars">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="accent" dot>Hiring</Badge>
          <Badge variant="success" dot>Online</Badge>
          <Badge variant="warning">Beta</Badge>
          <Badge variant="danger">Closed</Badge>
          <Badge variant="glass">Glass</Badge>
          <div className="flex -space-x-2 ml-4">
            <Avatar name="A B" status="online" ring />
            <Avatar name="C D" ring />
            <Avatar name="E F" ring />
          </div>
        </div>
      </Section>

      <Section title="Loading">
        <div className="flex items-center gap-6">
          <Spinner size={24} />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </Section>

      <Section title="Shortcuts">
        <p className="text-sm text-muted">
          Press <kbd className="px-1.5 py-0.5 rounded-md border border-border bg-surface text-xs">⌘K</kbd> to open the command palette.
        </p>
      </Section>

      <footer className="h-32" />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 border-t border-border">
      <Reveal as="h2" className="text-eyebrow mb-6">{title}</Reveal>
      {children}
    </section>
  );
}
