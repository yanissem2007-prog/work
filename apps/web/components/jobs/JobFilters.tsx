'use client';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { JobType, ExperienceLevel } from '@work/types';
import { cn } from '@/lib/utils';

export interface Filters {
  q?: string;
  type: JobType[];
  experience: ExperienceLevel[];
  remote: boolean;
  region: string[];
  skills: string[];
  salaryMin?: number;
}

interface Props {
  filters: Filters;
  facets?: {
    total: number; remote: number;
    byType: { _id: string; count: number }[];
    byLevel: { _id: string; count: number }[];
    byRegion: { _id: string; count: number }[];
  };
  onChange: (f: Filters) => void;
}

const TYPES: { id: JobType; label: string }[] = [
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'internship', label: 'Internship' },
  { id: 'contract', label: 'Contract' }
];

const LEVELS: { id: ExperienceLevel; label: string }[] = [
  { id: 'intern', label: 'Intern' }, { id: 'entry', label: 'Entry' },
  { id: 'mid', label: 'Mid' }, { id: 'senior', label: 'Senior' },
  { id: 'staff', label: 'Staff' }, { id: 'principal', label: 'Principal' }
];

const REGIONS = ['NA', 'EMEA', 'APAC', 'LATAM', 'MENA'];

const TOP_SKILLS = ['TypeScript', 'React', 'Python', 'Go', 'Rust', 'Swift', 'Figma', 'Design Systems', 'PyTorch', 'AWS'];

export function JobFilters({ filters, facets, onChange }: Props) {
  function toggle<T extends string>(key: 'type' | 'experience' | 'region' | 'skills', value: T) {
    const arr = (filters[key] as string[]).includes(value)
      ? (filters[key] as string[]).filter((v) => v !== value)
      : [...(filters[key] as string[]), value];
    onChange({ ...filters, [key]: arr });
  }
  function clear() { onChange({ type: [], experience: [], remote: false, region: [], skills: [] }); }

  const activeCount = filters.type.length + filters.experience.length + filters.region.length + filters.skills.length + (filters.remote ? 1 : 0) + (filters.salaryMin ? 1 : 0);

  return (
    <aside className="space-y-6 lg:sticky lg:top-4">
      <header className="flex items-center justify-between">
        <p className="text-eyebrow">Filters</p>
        {activeCount > 0 && (
          <button onClick={clear} className="text-2xs text-muted hover:text-fg flex items-center gap-1">
            <X size={11} /> Clear ({activeCount})
          </button>
        )}
      </header>

      {/* Remote toggle */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium">Remote only</span>
        <button
          role="switch" aria-checked={filters.remote}
          onClick={() => onChange({ ...filters, remote: !filters.remote })}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors',
            filters.remote ? 'bg-accent' : 'bg-surface-2'
          )}
        >
          <motion.span
            animate={{ x: filters.remote ? 22 : 2 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
            className="absolute top-0.5 left-0 size-4 rounded-full bg-bg shadow"
          />
        </button>
      </label>

      <Section title="Job type">
        {TYPES.map((t) => (
          <Chip key={t.id}
            label={t.label}
            count={facets?.byType.find((x) => x._id === t.id)?.count}
            checked={filters.type.includes(t.id)}
            onClick={() => toggle('type', t.id)} />
        ))}
      </Section>

      <Section title="Experience">
        {LEVELS.map((l) => (
          <Chip key={l.id}
            label={l.label}
            count={facets?.byLevel.find((x) => x._id === l.id)?.count}
            checked={filters.experience.includes(l.id)}
            onClick={() => toggle('experience', l.id)} />
        ))}
      </Section>

      <Section title="Region">
        {REGIONS.map((r) => (
          <Chip key={r} label={r}
            count={facets?.byRegion.find((x) => x._id === r)?.count}
            checked={filters.region.includes(r)}
            onClick={() => toggle('region', r)} />
        ))}
      </Section>

      <Section title="Salary (min)">
        <div className="px-1">
          <input
            type="range" min={0} max={400000} step={10000}
            value={filters.salaryMin ?? 0}
            onChange={(e) => onChange({ ...filters, salaryMin: Number(e.target.value) || undefined })}
            className="w-full accent-[var(--accent)]"
          />
          <p className="mt-1 text-2xs text-muted tabular-nums">
            {filters.salaryMin ? `${(filters.salaryMin / 1000).toFixed(0)}k+ USD` : 'Any'}
          </p>
        </div>
      </Section>

      <Section title="Skills">
        {TOP_SKILLS.map((s) => (
          <Chip key={s} label={s}
            checked={filters.skills.includes(s)}
            onClick={() => toggle('skills', s)} />
        ))}
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ label, count, checked, onClick }:
  { label: string; count?: number; checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs border transition',
        checked
          ? 'bg-accent/10 border-accent text-accent'
          : 'bg-surface border-border text-fg-soft hover:border-border-strong'
      )}
    >
      {checked && <Check size={11} />}
      {label}
      {count !== undefined && <span className="text-muted tabular-nums">{count}</span>}
    </button>
  );
}
