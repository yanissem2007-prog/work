'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, EyeOff, Eye, Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CvSection } from '@work/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  section: CvSection;
  onChange: (next: CvSection) => void;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
}

export function SectionEditor({ section, onChange, onRemove, dragHandle }: Props) {
  const [open, setOpen] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);

  function patchItem(i: number, p: Record<string, unknown>) {
    const items = [...(section.items ?? [])];
    items[i] = { ...items[i], ...p };
    onChange({ ...section, items });
  }
  function addItem(initial: Record<string, unknown>) {
    onChange({ ...section, items: [...(section.items ?? []), initial] });
  }
  function removeItem(i: number) {
    onChange({ ...section, items: (section.items ?? []).filter((_, idx) => idx !== i) });
  }

  async function aiSuggest(kind: 'summary' | 'experience-bullet' | 'skills-suggest', payload?: Record<string, unknown>, target?: { itemIndex: number; field: string }) {
    setAiBusy(true);
    try {
      const { data } = await api.post('/cv/ai/suggest', { kind, context: payload });
      const value = data.data.suggestion as string;
      if (kind === 'summary') onChange({ ...section, content: value });
      else if (kind === 'skills-suggest') {
        const skills = value.split(',').map((s) => s.trim()).filter(Boolean);
        onChange({ ...section, items: skills.map((name) => ({ name })) });
      } else if (target) patchItem(target.itemIndex, { [target.field]: value });
    } catch { toast.error('AI failed'); } finally { setAiBusy(false); }
  }

  return (
    <motion.div
      layout
      className={cn(
        'glass rounded-2xl border border-border transition',
        !section.visible && 'opacity-60'
      )}
    >
      <header className="flex items-center gap-2 p-3 border-b border-border">
        {dragHandle ?? (
          <span className="cursor-grab text-muted hover:text-fg p-1"><GripVertical size={14} /></span>
        )}
        <input
          value={section.title ?? ''} onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="flex-1 bg-transparent text-sm font-medium outline-none"
        />
        <Badge variant="soft" className="capitalize">{section.type}</Badge>
        <button onClick={() => onChange({ ...section, visible: !section.visible })}
          className="p-1.5 text-muted hover:text-fg rounded-lg hover:bg-surface"
          aria-label="Toggle visibility">
          {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button onClick={() => setOpen((v) => !v)}
          className="p-1.5 text-muted hover:text-fg rounded-lg hover:bg-surface text-2xs">
          {open ? '−' : '+'}
        </button>
        <button onClick={onRemove}
          className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-surface" aria-label="Remove">
          <Trash2 size={14} />
        </button>
      </header>

      {open && (
        <div className="p-4 space-y-3">
          {section.type === 'personal' && (
            <PersonalFields items={section.items?.[0] ?? {}}
              onChange={(p) => onChange({ ...section, items: [{ ...(section.items?.[0] ?? {}), ...p }] })} />
          )}

          {section.type === 'summary' && (
            <>
              <Textarea
                value={section.content ?? ''}
                onChange={(e) => onChange({ ...section, content: e.target.value })}
                placeholder="A punchy two-sentence summary…"
                className="min-h-24"
              />
              <Button size="xs" variant="glass" loading={aiBusy}
                onClick={() => aiSuggest('summary')}>
                <Sparkles size={11} /> AI rewrite
              </Button>
            </>
          )}

          {section.type === 'experience' && (
            <>
              {(section.items ?? []).map((it: any, i) => (
                <div key={i} className="space-y-2 p-3 border border-border rounded-xl">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input variant="glass" size="sm" placeholder="Company" value={it.company ?? ''} onChange={(e) => patchItem(i, { company: e.target.value })} />
                    <Input variant="glass" size="sm" placeholder="Role" value={it.role ?? ''} onChange={(e) => patchItem(i, { role: e.target.value })} />
                    <Input variant="glass" size="sm" type="month" placeholder="Start" value={it.start ?? ''} onChange={(e) => patchItem(i, { start: e.target.value })} />
                    <Input variant="glass" size="sm" type="month" placeholder="End" value={it.end ?? ''}
                      onChange={(e) => patchItem(i, { end: e.target.value })} disabled={!!it.current} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" checked={!!it.current} onChange={(e) => patchItem(i, { current: e.target.checked })} />
                    Currently work here
                  </label>
                  <Textarea
                    value={it.description ?? ''}
                    onChange={(e) => patchItem(i, { description: e.target.value })}
                    placeholder="What did you ship? Use numbers."
                    className="min-h-16"
                  />
                  <div className="flex justify-between">
                    <Button size="xs" variant="glass" loading={aiBusy}
                      onClick={() => aiSuggest('experience-bullet',
                        { role: it.role, company: it.company },
                        { itemIndex: i, field: 'description' })}>
                      <Sparkles size={11} /> AI bullets
                    </Button>
                    <button className="text-2xs text-muted hover:text-danger" onClick={() => removeItem(i)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="glass" onClick={() => addItem({ company: '', role: '', start: '', end: '' })}>
                <Plus size={12} /> Add experience
              </Button>
            </>
          )}

          {section.type === 'education' && (
            <>
              {(section.items ?? []).map((it: any, i) => (
                <div key={i} className="space-y-2 p-3 border border-border rounded-xl">
                  <Input variant="glass" size="sm" placeholder="School" value={it.school ?? ''} onChange={(e) => patchItem(i, { school: e.target.value })} />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input variant="glass" size="sm" placeholder="Degree" value={it.degree ?? ''} onChange={(e) => patchItem(i, { degree: e.target.value })} />
                    <Input variant="glass" size="sm" placeholder="Field" value={it.field ?? ''} onChange={(e) => patchItem(i, { field: e.target.value })} />
                    <Input variant="glass" size="sm" type="month" placeholder="Start" value={it.start ?? ''} onChange={(e) => patchItem(i, { start: e.target.value })} />
                    <Input variant="glass" size="sm" type="month" placeholder="End" value={it.end ?? ''} onChange={(e) => patchItem(i, { end: e.target.value })} />
                  </div>
                  <button className="text-2xs text-muted hover:text-danger" onClick={() => removeItem(i)}>Remove</button>
                </div>
              ))}
              <Button size="sm" variant="glass" onClick={() => addItem({ school: '', degree: '', field: '' })}>
                <Plus size={12} /> Add education
              </Button>
            </>
          )}

          {section.type === 'skills' && (
            <SkillEditor items={(section.items as any[]) ?? []}
              onChange={(items) => onChange({ ...section, items })}
              onAi={() => aiSuggest('skills-suggest')}
              aiBusy={aiBusy} />
          )}

          {section.type === 'projects' && (
            <>
              {(section.items ?? []).map((it: any, i) => (
                <div key={i} className="space-y-2 p-3 border border-border rounded-xl">
                  <Input variant="glass" size="sm" placeholder="Project title" value={it.title ?? ''} onChange={(e) => patchItem(i, { title: e.target.value })} />
                  <Input variant="glass" size="sm" placeholder="URL (optional)" value={it.url ?? ''} onChange={(e) => patchItem(i, { url: e.target.value })} />
                  <Textarea
                    value={it.description ?? ''}
                    onChange={(e) => patchItem(i, { description: e.target.value })}
                    placeholder="What's special about it?"
                    className="min-h-16"
                  />
                  <button className="text-2xs text-muted hover:text-danger" onClick={() => removeItem(i)}>Remove</button>
                </div>
              ))}
              <Button size="sm" variant="glass" onClick={() => addItem({ title: '' })}>
                <Plus size={12} /> Add project
              </Button>
            </>
          )}

          {section.type === 'links' && (
            <>
              {(section.items ?? []).map((it: any, i) => (
                <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                  <Input variant="glass" size="sm" placeholder="Label" value={it.label ?? ''} onChange={(e) => patchItem(i, { label: e.target.value })} />
                  <Input variant="glass" size="sm" placeholder="URL" value={it.url ?? ''} onChange={(e) => patchItem(i, { url: e.target.value })} />
                  <button className="text-muted hover:text-danger" onClick={() => removeItem(i)}><Trash2 size={13} /></button>
                </div>
              ))}
              <Button size="sm" variant="glass" onClick={() => addItem({ label: '', url: '' })}>
                <Plus size={12} /> Add link
              </Button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

function PersonalFields({ items, onChange }: { items: any; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <Input variant="glass" size="sm" placeholder="Full name" value={items.name ?? ''} onChange={(e) => onChange({ name: e.target.value })} />
      <Input variant="glass" size="sm" placeholder="Headline" value={items.headline ?? ''} onChange={(e) => onChange({ headline: e.target.value })} />
      <Input variant="glass" size="sm" placeholder="Email" type="email" value={items.email ?? ''} onChange={(e) => onChange({ email: e.target.value })} />
      <Input variant="glass" size="sm" placeholder="Phone" value={items.phone ?? ''} onChange={(e) => onChange({ phone: e.target.value })} />
      <Input variant="glass" size="sm" placeholder="Location" value={items.location ?? ''} onChange={(e) => onChange({ location: e.target.value })} />
      <Input variant="glass" size="sm" placeholder="Website" value={items.website ?? ''} onChange={(e) => onChange({ website: e.target.value })} />
    </div>
  );
}

function SkillEditor({ items, onChange, onAi, aiBusy }: {
  items: any[]; onChange: (items: any[]) => void; onAi: () => void; aiBusy: boolean
}) {
  const [v, setV] = useState('');
  function add() {
    const name = v.trim(); if (!name) return;
    if (items.some((x) => (x.name ?? x) === name)) return;
    onChange([...items, { name }]); setV('');
  }
  return (
    <>
      <Input variant="glass" size="sm" value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder="Type a skill, press Enter" />
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => {
          const name = typeof it === 'string' ? it : it.name;
          return (
            <button key={i} onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
              <Badge variant="accent">{name} ×</Badge>
            </button>
          );
        })}
      </div>
      <Button size="xs" variant="glass" loading={aiBusy} onClick={onAi}>
        <Sparkles size={11} /> AI suggest skills
      </Button>
    </>
  );
}
