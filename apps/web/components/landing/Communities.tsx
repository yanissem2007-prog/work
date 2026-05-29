'use client';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Code2, Palette, Briefcase, GraduationCap, Rocket } from 'lucide-react';

const COMMUNITIES = [
  { name: 'Frontend Cult', members: '24.1k', icon: Code2, tags: ['React', 'Motion', 'CSS'], color: 'oklch(72% 0.2 264)' },
  { name: 'Design Heroes', members: '18.6k', icon: Palette, tags: ['Figma', 'Systems'], color: 'oklch(70% 0.24 340)' },
  { name: 'Algeria Tech', members: '9.4k', icon: Rocket, tags: ['Startup', 'YC'], color: 'oklch(80% 0.14 200)' },
  { name: 'Recruiters Lab', members: '6.2k', icon: Briefcase, tags: ['Hiring'], color: 'oklch(85% 0.18 130)' },
  { name: 'CS Students', members: '32.7k', icon: GraduationCap, tags: ['Internships', 'Theses'], color: 'oklch(72% 0.2 264)' },
  { name: 'Web3 Builders', members: '4.1k', icon: Users, tags: ['Solidity'], color: 'oklch(70% 0.24 340)' }
];

export function CommunitiesSection() {
  return (
    <section className="relative py-section overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-eyebrow mb-3">Communities</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter">
            Find your <span className="gradient-text">people.</span>
          </h2>
          <p className="mt-4 text-muted">
            Discord-style chat, Reddit-style threads, LinkedIn-style profiles.
            Join hundreds of communities curated by experts.
          </p>
        </Reveal>

        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMMUNITIES.map((c, i) => (
            <StaggerItem key={c.name}>
              <Card variant="glass" interactive tilt glow className="group h-full">
                <div className="flex items-start justify-between">
                  <div
                    className="size-12 rounded-2xl grid place-items-center shadow-glow"
                    style={{ background: `linear-gradient(135deg, ${c.color}, oklch(70% 0.24 340))` }}
                  >
                    <c.icon size={20} className="text-white" />
                  </div>
                  <Badge variant="soft" dot dotColor={c.color}>{c.members}</Badge>
                </div>
                <CardTitle className="mt-5">{c.name}</CardTitle>
                <CardDescription className="mt-1">
                  Live conversations, weekly drops, and real opportunities.
                </CardDescription>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
