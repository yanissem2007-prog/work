'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Plus, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Cat = 'design' | 'development' | 'editing' | 'writing' | 'marketing';
type Tier = 'basic' | 'standard' | 'premium';

interface Pkg {
  tier: Tier; title: string; description: string;
  price: number; deliveryDays: number; revisions: number;
  features: string[];
}

const CATEGORIES: { id: Cat; label: string }[] = [
  { id: 'design', label: 'Design' }, { id: 'development', label: 'Development' },
  { id: 'editing', label: 'Editing' }, { id: 'writing', label: 'Writing' },
  { id: 'marketing', label: 'Marketing' }
];

const STARTER: Record<Tier, Pkg> = {
  basic:    { tier: 'basic',    title: 'Quick win',     description: '', price: 50,  deliveryDays: 5,  revisions: 1, features: [] },
  standard: { tier: 'standard', title: 'Full package',  description: '', price: 150, deliveryDays: 7,  revisions: 2, features: [] },
  premium:  { tier: 'premium',  title: 'Premium',       description: '', price: 400, deliveryDays: 14, revisions: 3, features: [] }
};

export default function NewGigPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Cat>('design');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [cover, setCover] = useState('');
  const [packages, setPackages] = useState<Pkg[]>([STARTER.basic, STARTER.standard, STARTER.premium]);
  const [busy, setBusy] = useState(false);

  function patchPkg(t: Tier, p: Partial<Pkg>) {
    setPackages((arr) => arr.map((x) => x.tier === t ? { ...x, ...p } : x));
  }

  function addSkill(v: string) {
    const s = v.trim(); if (!s || skills.includes(s)) { setSkillInput(''); return; }
    setSkills([...skills, s]); setSkillInput('');
  }

  async function submit() {
    if (title.length < 8 || description.length < 40) {
      toast.error('Add a longer title and description.');
      return;
    }
    setBusy(true);
    try {
      const r = await api.post('/freelance/gigs', {
        title, category, description, skills,
        cover: cover || undefined,
        packages: packages.map((p) => ({
          ...p,
          features: p.features.filter(Boolean)
        }))
      });
      router.push(`/freelance/gig/${r.data.data.slug}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Sparkles size={11} /> Become a seller
        </div>
        <h1 className="mt-3 font-display text-4xl tracking-tightest">Create a service</h1>
        <p className="mt-2 text-sm text-muted">A great title, a clear description, three tiers — that's all.</p>
      </header>

      <Card variant="glass" className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="I will design a premium SaaS landing page in 5 days" />

        <div>
          <p className="text-eyebrow mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={cn(
                  'rounded-pill px-3 py-1 text-xs border transition capitalize',
                  category === c.id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
                )}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea label="Description" value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What do buyers get? What outcomes? What's included / not included?"
          className="min-h-40" />
        <p className="text-2xs text-muted text-right">{description.length} / 8000</p>

        <Input label="Cover image URL (optional)" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." />

        <div>
          <p className="text-eyebrow mb-2">Skills</p>
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
        </div>
      </Card>

      <section>
        <p className="text-eyebrow mb-3">Packages</p>
        <div className="grid lg:grid-cols-3 gap-3">
          {packages.map((p, i) => (
            <motion.div key={p.tier}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Card variant="glass" className="space-y-3">
                <p className="text-2xs uppercase tracking-caps capitalize text-accent">{p.tier}</p>
                <Input variant="glass" size="sm" placeholder="Package title"
                  value={p.title} onChange={(e) => patchPkg(p.tier, { title: e.target.value })} />
                <Textarea
                  value={p.description}
                  onChange={(e) => patchPkg(p.tier, { description: e.target.value })}
                  placeholder="What's in this tier?"
                  className="min-h-20"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input variant="glass" size="sm" type="number" leading={<span className="text-2xs">$</span>}
                    value={p.price} onChange={(e) => patchPkg(p.tier, { price: Number(e.target.value) || 0 })} />
                  <Input variant="glass" size="sm" type="number" placeholder="Days"
                    value={p.deliveryDays} onChange={(e) => patchPkg(p.tier, { deliveryDays: Number(e.target.value) || 0 })} />
                  <Input variant="glass" size="sm" type="number" placeholder="Rev"
                    value={p.revisions} onChange={(e) => patchPkg(p.tier, { revisions: Number(e.target.value) || 0 })} />
                </div>

                <div>
                  <p className="text-2xs text-muted mb-1.5">Features</p>
                  {p.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 mb-1">
                      <Input variant="glass" size="sm" value={f}
                        onChange={(e) => {
                          const next = [...p.features]; next[idx] = e.target.value;
                          patchPkg(p.tier, { features: next });
                        }} />
                      <button onClick={() => patchPkg(p.tier, { features: p.features.filter((_, i) => i !== idx) })}
                        className="text-muted hover:text-danger">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => patchPkg(p.tier, { features: [...p.features, ''] })}
                    className="text-2xs text-accent hover:underline inline-flex items-center gap-1 mt-1">
                    <Plus size={11} /> Add feature
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <Button variant="accent" size="xl" magnetic className="w-full"
        loading={busy} onClick={submit}>
        Publish service <ArrowRight size={16} />
      </Button>
    </div>
  );
}
