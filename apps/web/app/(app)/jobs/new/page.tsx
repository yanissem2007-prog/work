'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { Company, JobType, ExperienceLevel } from '@work/types';

const TYPES: JobType[] = ['full-time', 'part-time', 'internship', 'contract'];
const LEVELS: ExperienceLevel[] = ['intern', 'entry', 'mid', 'senior', 'staff', 'principal'];
const REGIONS = ['NA', 'EMEA', 'APAC', 'LATAM', 'MENA'];

export default function NewJobPage() {
  const router = useRouter();
  useAuth({ required: true, roles: ['recruiter', 'company', 'admin'] });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies', 'mine'],
    queryFn: async () => (await api.get('/companies/mine')).data.data
  });

  const [companyId, setCompanyId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<JobType>('full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [remote, setRemote] = useState(false);
  const [location, setLocation] = useState('');
  const [region, setRegion] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [busy, setBusy] = useState(false);

  function addSkill(s: string) {
    const v = s.trim(); if (!v) return;
    if (!skills.includes(v)) setSkills([...skills, v]);
    setSkillInput('');
  }

  async function submit() {
    if (!companyId || !title.trim() || description.length < 20) {
      toast.error('Fill in company, title and at least a short description');
      return;
    }
    setBusy(true);
    try {
      const r = await api.post('/jobs', {
        companyId, title, description, type, experienceLevel, remote,
        location: location || undefined, region: region || undefined,
        salaryMin: salaryMin || undefined, salaryMax: salaryMax || undefined,
        skills
      });
      toast.success('Job posted');
      router.push(`/jobs/${r.data.data._id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not post');
    } finally { setBusy(false); }
  }

  if (companies && companies.length === 0) {
    return (
      <Card variant="glass" className="text-center py-16">
        <div className="mx-auto size-16 rounded-2xl bg-grad-accent shadow-glow grid place-items-center">
          <Briefcase size={22} className="text-accent-fg" />
        </div>
        <h2 className="mt-5 font-display text-2xl tracking-tighter">Create a company first</h2>
        <p className="mt-2 text-sm text-muted">You need a company page before posting jobs.</p>
        <Button variant="accent" magnetic className="mt-6" onClick={() => router.push('/companies/new')}>
          <Plus size={14} /> Create company
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tighter">Post a job</h1>
        <p className="text-sm text-muted mt-1">Reach 240k+ active professionals.</p>
      </header>

      {companies && (
        <Card variant="glass">
          <p className="text-eyebrow mb-3">Company</p>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <button key={c._id}
                onClick={() => setCompanyId(c._id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border transition',
                  companyId === c._id ? 'border-accent bg-surface-2' : 'border-border bg-surface hover:border-border-strong'
                )}>
                <div className="size-6 rounded-md bg-bg-elev grid place-items-center text-xs">
                  {c.name.slice(0, 1)}
                </div>
                <span className="text-sm">{c.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card variant="glass" className="space-y-4">
        <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Senior Product Engineer" />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this role do? What does success look like in 90 days?"
          className="min-h-48"
        />
        <p className="text-2xs text-muted text-right">{description.length} / 20000</p>
      </Card>

      <Card variant="glass" className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-2xs uppercase tracking-caps text-muted mb-2">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <Chip key={t} active={type === t} onClick={() => setType(t)}>{t.replace('-', ' ')}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-2xs uppercase tracking-caps text-muted mb-2">Experience</p>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <Chip key={l} active={experienceLevel === l} onClick={() => setExperienceLevel(l)}>{l}</Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card variant="glass" className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">Remote</span>
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)}
            className="accent-[var(--accent)]" />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Location" placeholder="Algiers / NYC / SF" value={location}
            onChange={(e) => setLocation(e.target.value)} />
          <div>
            <p className="text-2xs uppercase tracking-caps text-muted mb-2">Region</p>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <Chip key={r} active={region === r} onClick={() => setRegion(region === r ? '' : r)}>{r}</Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card variant="glass">
        <p className="text-eyebrow mb-3">Salary range (USD)</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input type="number" leading={<span className="text-xs">$</span>} placeholder="Min"
            value={salaryMin} onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))} />
          <Input type="number" leading={<span className="text-xs">$</span>} placeholder="Max"
            value={salaryMax} onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </Card>

      <Card variant="glass">
        <p className="text-eyebrow mb-3">Skills</p>
        <Input
          placeholder="Type a skill, press Enter"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
        />
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <button key={s} onClick={() => setSkills(skills.filter((x) => x !== s))}>
                <Badge variant="accent">{s} ×</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Button variant="accent" size="lg" magnetic className="w-full"
        loading={busy} onClick={submit}
        disabled={!companyId || !title.trim() || description.length < 20}>
        Publish job <ArrowRight size={16} />
      </Button>
    </div>
  );
}

function Chip({ active, onClick, children }:
  { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-pill px-3 py-1 text-xs border capitalize transition',
        active ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-fg-soft hover:border-border-strong'
      )}>
      {children}
    </button>
  );
}
