'use client';
import { motion } from 'framer-motion';
import { LayoutGrid, BookOpen, ScanSearch, SpellCheck, Cpu, Briefcase, FolderGit2 } from 'lucide-react';

interface Props {
  values: {
    structure: number; readability: number; ats: number; grammar: number;
    technologies: number; experience: number; portfolio: number;
  };
}

const ROWS = [
  { key: 'structure', label: 'Structure', icon: LayoutGrid, hint: 'Sections, hierarchy, scan-ability' },
  { key: 'readability', label: 'Readability', icon: BookOpen, hint: 'Sentence length, tone, scan speed' },
  { key: 'ats', label: 'ATS Optimization', icon: ScanSearch, hint: 'Parsable headings, keyword density' },
  { key: 'grammar', label: 'Grammar', icon: SpellCheck, hint: 'Voice, typos, weak phrasing' },
  { key: 'technologies', label: 'Technologies', icon: Cpu, hint: 'Stack relevance, breadth, depth' },
  { key: 'experience', label: 'Experience', icon: Briefcase, hint: 'Measurable outcomes, action verbs' },
  { key: 'portfolio', label: 'Portfolio', icon: FolderGit2, hint: 'Links, projects, public work' }
] as const;

export function Breakdown({ values }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {ROWS.map((r, i) => {
        const v = values[r.key];
        const tone = v >= 80 ? 'oklch(78% 0.22 142)' : v >= 60 ? 'oklch(78% 0.18 200)' : v >= 40 ? 'oklch(78% 0.18 70)' : 'oklch(70% 0.22 25)';
        return (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-2xl p-4 hover-lift"
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl grid place-items-center shadow-glow"
                style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}>
                <r.icon size={16} className="text-accent-fg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{r.label}</p>
                  <span className="text-base font-display tracking-tighter tabular-nums" style={{ color: tone }}>
                    {v}
                  </span>
                </div>
                <p className="text-2xs text-muted">{r.hint}</p>
                <div className="mt-2 h-1.5 bg-surface-2 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} whileInView={{ width: `${v}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.04 }}
                    className="h-full rounded"
                    style={{ background: `linear-gradient(90deg, var(--accent), ${tone})`, boxShadow: `0 0 12px ${tone}` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
