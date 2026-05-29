'use client';
import { motion } from 'framer-motion';
import { Check, Wrench, FolderGit2, BookOpen, Flag, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description?: string;
  kind?: 'skill' | 'project' | 'resource' | 'milestone';
  durationWeeks?: number;
  resources?: { title: string; url?: string; type?: string }[];
  done?: boolean;
}

const KIND_ICON = {
  skill: Wrench,
  project: FolderGit2,
  resource: BookOpen,
  milestone: Flag
} as const;

const KIND_TONE = {
  skill: 'oklch(72% 0.2 264)',
  project: 'oklch(70% 0.24 340)',
  resource: 'oklch(78% 0.18 200)',
  milestone: 'oklch(75% 0.22 50)'
} as const;

interface Props {
  step: Step;
  index: number;
  side: 'left' | 'right';
  onToggle: () => void;
}

export function TimelineNode({ step, index, side, onToggle }: Props) {
  const kind = step.kind ?? 'skill';
  const Icon = KIND_ICON[kind];
  const tone = KIND_TONE[kind];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative grid items-center gap-4',
        // mobile: card right of node; desktop: alternate
        'grid-cols-[40px_1fr] sm:grid-cols-[1fr_56px_1fr]'
      )}
    >
      {/* Spacer for desktop alternating layout */}
      <div className={cn('hidden sm:block', side === 'left' ? 'order-1' : 'order-3')}>
        {side === 'left' && <Card step={step} done={step.done} tone={tone} onToggle={onToggle} />}
      </div>

      {/* Node */}
      <div className="order-1 sm:order-2 relative grid place-items-center w-10 sm:w-14 h-14">
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'relative size-10 rounded-full grid place-items-center transition border-2',
            step.done
              ? 'border-transparent shadow-glow'
              : 'border-border bg-bg hover:border-border-strong'
          )}
          style={step.done ? { background: `linear-gradient(135deg, ${tone}, var(--accent))` } : undefined}
          aria-label={step.done ? 'Mark not done' : 'Mark done'}
        >
          {/* Pulse ring on done */}
          {step.done && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: tone, opacity: 0.35 }}
              animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          )}
          {step.done
            ? <Check size={14} className="text-white relative" />
            : <Icon size={14} style={{ color: tone }} className="relative" />}
        </motion.button>
      </div>

      <div className={cn('order-2 sm:order-3', side === 'right' ? '' : 'sm:order-1 sm:hidden')}>
        {/* Right side card on desktop alternating */}
        {(side === 'right') && <Card step={step} done={step.done} tone={tone} onToggle={onToggle} />}
      </div>

      {/* Mobile always-visible card */}
      <div className="order-2 sm:hidden">
        <Card step={step} done={step.done} tone={tone} onToggle={onToggle} />
      </div>
    </motion.div>
  );
}

function Card({ step, done, tone, onToggle }: { step: Step; done?: boolean; tone: string; onToggle: () => void }) {
  return (
    <div className={cn(
      'rounded-2xl border p-4 transition',
      done ? 'border-border bg-bg-elev/60 opacity-80' : 'border-border bg-bg-elev/40 hover:border-border-strong'
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-sm font-medium leading-snug', done && 'line-through text-muted')}>
          {step.title}
        </p>
        {step.durationWeeks && (
          <span className="text-2xs text-muted shrink-0 px-1.5 py-0.5 rounded bg-surface tabular-nums">
            {step.durationWeeks}w
          </span>
        )}
      </div>
      {step.description && (
        <p className={cn('mt-1 text-xs text-muted line-clamp-3', done && 'line-through')}>{step.description}</p>
      )}
      {step.kind && (
        <span className="mt-2 inline-block text-[10px] uppercase tracking-caps font-medium"
          style={{ color: tone }}>
          {step.kind}
        </span>
      )}
      {step.resources && step.resources.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {step.resources.slice(0, 3).map((r, i) => (
            <li key={i} className="text-2xs">
              {r.url
                ? <a href={r.url} target="_blank" rel="noopener" className="text-accent hover:underline inline-flex items-center gap-1">
                    <ExternalLink size={9} /> {r.title}
                  </a>
                : <span className="text-muted">· {r.title}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
