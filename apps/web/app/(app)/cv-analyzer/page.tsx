'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, FileText, ArrowRight, Sparkles, Award, BookOpen, Briefcase, GraduationCap, MapPin, Globe2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { UploadZone } from '@/components/cv-analyzer/UploadZone';
import { ScoreCircle } from '@/components/cv-analyzer/ScoreCircle';
import { Breakdown } from '@/components/cv-analyzer/Breakdown';
import { fmtSalary } from '@/components/jobs/JobCard';
import { cn } from '@/lib/utils';

interface RecommendedJob {
  id: string; title: string; type: string; experienceLevel: string;
  location?: string; remote?: boolean; salaryMin?: number; salaryMax?: number; currency?: string;
  skills?: string[]; company?: { name?: string; slug?: string; logo?: string };
  href: string;
}

interface Result {
  id: string;
  pages?: number; wordCount?: number; fileName?: string;
  report: {
    score: number; summary: string;
    breakdown: { structure: number; readability: number; ats: number; grammar: number; technologies: number; experience: number; portfolio: number };
    weaknesses: { severity: 'low' | 'medium' | 'high'; title: string; detail: string }[];
    suggestions: { titles: string[]; summary: string; bullets: string[]; portfolio: string[] };
    recommendations: { missingSkills: string[]; certifications: string[]; courses: string[]; targetRoles: string[] };
    detectedSkills: string[];
  };
  recommendedJobs: RecommendedJob[];
}

const SEVERITY = {
  high: { icon: AlertTriangle, color: 'oklch(70% 0.22 25)', label: 'Critical' },
  medium: { icon: AlertCircle, color: 'oklch(78% 0.18 70)', label: 'Important' },
  low: { icon: Info, color: 'oklch(78% 0.18 200)', label: 'Nice-to-have' }
};

export default function CvAnalyzerPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function analyze(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv-analyzer/analyze`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Failed');
      setResult(data.data);
    } catch (e: any) {
      toast.error(e.message ?? 'Analysis failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <header className="text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Sparkles size={11} /> Powered by WORK AI
        </motion.div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tightest">
          Get your CV <span className="gradient-text italic">scored</span>.
        </h1>
        <p className="mt-3 text-muted">
          AI reads your CV, scores it on 7 dimensions, and gives you concrete rewrites.
        </p>
      </header>

      {!result ? (
        <UploadZone busy={busy} onFile={analyze} />
      ) : (
        <Result result={result} onReset={() => setResult(null)} />
      )}

      {!result && (
        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {[
            { icon: Sparkles, title: 'AI-powered analysis', body: '7 dimensions, structured feedback, no fluff.' },
            { icon: Award, title: 'ATS-ready', body: 'We check what real recruiter systems see.' },
            { icon: Briefcase, title: 'Job matches', body: 'Live jobs surfaced from your detected skills.' }
          ].map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 text-center">
              <f.icon size={16} className="text-accent mx-auto mb-2" />
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-2xs text-muted mt-1">{f.body}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Result({ result, onReset }: { result: Result; onReset: () => void }) {
  const { report } = result;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Hero — score + summary */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8 grid lg:grid-cols-[260px_1fr] gap-8 items-center">
        <div className="flex justify-center"><ScoreCircle value={report.score} /></div>
        <div>
          <p className="text-eyebrow mb-2">Your WORK Score</p>
          <h2 className="font-display text-2xl tracking-tighter leading-tight">{report.summary}</h2>
          {result.fileName && (
            <p className="mt-3 text-xs text-muted flex items-center gap-1.5">
              <FileText size={12} /> {result.fileName} · {result.pages ?? '—'} pages · {result.wordCount ?? '—'} words
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="glass" size="sm" onClick={onReset}>Upload another</Button>
            <Link href="/cv-builder"><Button variant="accent" size="sm" magnetic><Sparkles size={13} /> Open CV Builder</Button></Link>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <Section title="Breakdown" eyebrow="7 dimensions">
        <Breakdown values={report.breakdown} />
      </Section>

      {/* Weaknesses */}
      {report.weaknesses.length > 0 && (
        <Section title="What to fix first" eyebrow={`${report.weaknesses.length} issues`}>
          <div className="space-y-2">
            {report.weaknesses.map((w, i) => {
              const s = SEVERITY[w.severity];
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 flex gap-3 hover-lift"
                >
                  <div className="size-9 rounded-xl grid place-items-center shrink-0 shadow-glow"
                    style={{ background: `linear-gradient(135deg, ${s.color}, var(--accent))` }}>
                    <s.icon size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{w.title}</p>
                      <Badge variant="soft" className="text-2xs">{s.label}</Badge>
                    </div>
                    <p className="text-sm text-muted mt-0.5">{w.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Suggestions */}
      <Section title="AI suggestions" eyebrow="Specific rewrites">
        <div className="grid lg:grid-cols-2 gap-3">
          <Card variant="glass">
            <p className="text-eyebrow mb-2">Better titles</p>
            <ul className="space-y-1.5">
              {report.suggestions.titles.map((t, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent shadow-glow" /> {t}
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="glass">
            <p className="text-eyebrow mb-2">Stronger summary</p>
            <p className="text-sm text-fg-soft">{report.suggestions.summary}</p>
          </Card>

          <Card variant="glass" className="lg:col-span-2">
            <p className="text-eyebrow mb-2">Rewritten experience bullets</p>
            <ul className="space-y-2">
              {report.suggestions.bullets.map((b, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="text-sm flex gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-grad-accent shadow-glow shrink-0" />
                  {b}
                </motion.li>
              ))}
            </ul>
          </Card>

          {report.suggestions.portfolio.length > 0 && (
            <Card variant="glass" className="lg:col-span-2">
              <p className="text-eyebrow mb-2">Portfolio project ideas</p>
              <div className="flex flex-wrap gap-1.5">
                {report.suggestions.portfolio.map((p) => <Badge key={p} variant="soft">{p}</Badge>)}
              </div>
            </Card>
          )}
        </div>
      </Section>

      {/* Skills detected vs missing */}
      <Section title="Skills" eyebrow="Detected & gaps">
        <div className="grid sm:grid-cols-2 gap-3">
          <Card variant="glass">
            <p className="text-eyebrow mb-2">Detected on your CV</p>
            <div className="flex flex-wrap gap-1.5">
              {report.detectedSkills.length === 0
                ? <p className="text-xs text-muted">None detected.</p>
                : report.detectedSkills.map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
            </div>
          </Card>
          <Card variant="glass">
            <p className="text-eyebrow mb-2">Add these next</p>
            <div className="flex flex-wrap gap-1.5">
              {report.recommendations.missingSkills.map((s) => <Badge key={s} variant="accent">+ {s}</Badge>)}
            </div>
          </Card>
        </div>
      </Section>

      {/* Recs grid */}
      <Section title="Recommendations" eyebrow="Next steps">
        <div className="grid sm:grid-cols-2 gap-3">
          <RecBlock icon={Award} title="Certifications" items={report.recommendations.certifications} />
          <RecBlock icon={GraduationCap} title="Courses" items={report.recommendations.courses} />
          <RecBlock icon={BookOpen} title="Target roles" items={report.recommendations.targetRoles} className="sm:col-span-2" />
        </div>
      </Section>

      {/* Live jobs */}
      {result.recommendedJobs.length > 0 && (
        <Section title="Live jobs that match" eyebrow={`${result.recommendedJobs.length} roles`}>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.recommendedJobs.map((j) => (
              <Link key={j.id} href={j.href}>
                <Card variant="glass" interactive className="h-full">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-bg-elev border border-border grid place-items-center shrink-0 overflow-hidden">
                      {j.company?.logo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={j.company.logo} alt="" className="size-full object-cover" />
                        : <Briefcase size={14} className="text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{j.title}</p>
                      <p className="text-xs text-muted truncate">{j.company?.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-2xs text-muted">
                        <span className="flex items-center gap-1">
                          {j.remote ? <><Globe2 size={10} /> Remote</> : <><MapPin size={10} /> {j.location ?? '—'}</>}
                        </span>
                        {(j.salaryMin || j.salaryMax) && (
                          <span>· {fmtSalary(j.salaryMin, j.salaryMax, j.currency)}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted self-center" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </motion.div>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h3 className="font-display text-xl tracking-tighter">{title}</h3>
        {eyebrow && <span className="text-eyebrow">{eyebrow}</span>}
      </header>
      {children}
    </section>
  );
}

function RecBlock({ icon: Icon, title, items, className }:
  { icon: LucideIcon; title: string; items: string[]; className?: string }) {
  return (
    <Card variant="glass" className={cn('h-full', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-accent" />
        <p className="text-eyebrow">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((s) => (
          <li key={s} className="text-sm flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent shadow-glow" /> {s}
          </li>
        ))}
      </ul>
    </Card>
  );
}
