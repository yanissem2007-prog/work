'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, EyeOff, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Stars } from '@/components/freelance/Stars';
import { cn } from '@/lib/utils';

type Status = 'current' | 'former' | 'intern' | 'contractor';
const STATUSES: Status[] = ['current', 'former', 'intern', 'contractor'];

const DIMS = [
  { key: 'culture',    label: 'Culture & values' },
  { key: 'worklife',   label: 'Work-life balance' },
  { key: 'comp',       label: 'Compensation' },
  { key: 'management', label: 'Management' },
  { key: 'growth',     label: 'Career growth' }
] as const;

export default function WriteReviewPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [rating, setRating] = useState(4);
  const [breakdown, setBreakdown] = useState({ culture: 4, worklife: 4, comp: 4, management: 4, growth: 4 });
  const [title, setTitle] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [advice, setAdvice] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<Status>('current');
  const [tenureYears, setTenureYears] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (title.length < 4) { toast.error('Add a title'); return; }
    setBusy(true);
    try {
      await api.post(`/companies/${slug}/reviews`, {
        rating, breakdown, title,
        pros: pros || undefined, cons: cons || undefined, advice: advice || undefined,
        recommend,
        role: role || undefined, employmentStatus: status,
        tenureYears: tenureYears === '' ? undefined : Number(tenureYears),
        location: location || undefined,
        anonymous
      });
      toast.success('Review published');
      router.push(`/companies/${slug}?tab=reviews`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit text-muted">
        <a href={`/companies/${slug}`}><ArrowLeft size={12} /> Back to {slug}</a>
      </Button>

      <header>
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Sparkles size={11} /> Share your experience
        </div>
        <h1 className="mt-3 font-display text-4xl tracking-tightest">Review this company</h1>
        <p className="mt-2 text-sm text-muted">Honest reviews help students and recruiters make better decisions.</p>
      </header>

      {/* Overall rating */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="text-center">
          <p className="text-eyebrow mb-3">Overall rating</p>
          <div className="flex justify-center">
            <Stars value={rating} size={36} interactive onChange={setRating} />
          </div>
          <p className="mt-2 text-sm text-muted">{rating} / 5</p>
        </Card>
      </motion.section>

      <Card variant="glass" className="space-y-4">
        <Input label="Headline" value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Strong engineering culture, ship-or-die intensity"' />

        <div>
          <p className="text-eyebrow mb-2">Employment status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn(
                  'rounded-pill px-3 py-1 text-xs border capitalize transition',
                  status === s ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                )}>{s}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Input variant="glass" size="sm" label="Role" value={role}
            onChange={(e) => setRole(e.target.value)} placeholder="Senior Engineer" />
          <Input variant="glass" size="sm" label="Tenure (years)" type="number" min={0}
            value={tenureYears} onChange={(e) => setTenureYears(e.target.value === '' ? '' : Number(e.target.value))} />
          <Input variant="glass" size="sm" label="Location" value={location}
            onChange={(e) => setLocation(e.target.value)} placeholder="Remote / NYC" />
        </div>
      </Card>

      <Card variant="glass">
        <p className="text-eyebrow mb-3">Detailed ratings</p>
        <div className="space-y-3">
          {DIMS.map((d) => (
            <div key={d.key} className="flex items-center justify-between">
              <span className="text-sm">{d.label}</span>
              <Stars value={(breakdown as any)[d.key]} size={20} interactive
                onChange={(v) => setBreakdown({ ...breakdown, [d.key]: v })} />
            </div>
          ))}
        </div>
      </Card>

      <Card variant="glass" className="space-y-3">
        <Textarea
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          placeholder="What's great about working here?"
          className="min-h-28"
        />
        <Textarea
          value={cons}
          onChange={(e) => setCons(e.target.value)}
          placeholder="What's not great?"
          className="min-h-28"
        />
        <Textarea
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          placeholder="Advice to management (optional)"
          className="min-h-20"
        />
      </Card>

      <Card variant="glass" className="space-y-3">
        <button onClick={() => setRecommend(!recommend)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-border-strong transition">
          <span className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={14} className={cn(recommend ? 'text-success' : 'text-muted')} />
            I'd recommend this company to a friend
          </span>
          <span className={cn(
            'relative w-10 h-5 rounded-full transition',
            recommend ? 'bg-success' : 'bg-surface-2'
          )}>
            <motion.span
              animate={{ x: recommend ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              className="absolute top-0.5 left-0 size-4 rounded-full bg-bg shadow"
            />
          </span>
        </button>

        <button onClick={() => setAnonymous(!anonymous)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-border-strong transition">
          <span className="flex items-center gap-2 text-sm">
            <EyeOff size={14} className={cn(anonymous ? 'text-accent' : 'text-muted')} />
            Post anonymously
          </span>
          <span className={cn(
            'relative w-10 h-5 rounded-full transition',
            anonymous ? 'bg-accent' : 'bg-surface-2'
          )}>
            <motion.span
              animate={{ x: anonymous ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              className="absolute top-0.5 left-0 size-4 rounded-full bg-bg shadow"
            />
          </span>
        </button>
        {anonymous && (
          <p className="text-2xs text-muted flex items-center gap-1.5">
            <ShieldCheck size={11} /> Your identity won't appear — but WORK keeps an internal record for moderation.
          </p>
        )}
      </Card>

      <Button variant="accent" size="xl" magnetic className="w-full"
        loading={busy} onClick={submit} disabled={title.length < 4}>
        Publish review
      </Button>
    </div>
  );
}
