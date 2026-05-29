'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCENTS = [
  'oklch(72% 0.2 264)', 'oklch(70% 0.24 340)', 'oklch(80% 0.14 200)',
  'oklch(85% 0.18 130)', 'oklch(75% 0.22 50)', 'oklch(68% 0.22 25)'
];

export function CreateCommunityModal({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: (slug: string) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [busy, setBusy] = useState(false);

  function autoSlug(v: string) {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  }

  async function create() {
    if (!name.trim() || !slug.trim()) return;
    setBusy(true);
    try {
      const r = await api.post('/communities', { name, slug, description, accent, visibility });
      onCreated(r.data.data.slug);
      reset(); onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not create');
    } finally { setBusy(false); }
  }

  function reset() { setName(''); setSlug(''); setDescription(''); setAccent(ACCENTS[0]); setVisibility('public'); }

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      title="Create a community"
      description="Spin up a space for your people. Three starter channels are added for you."
      size="md"
    >
      <div className="space-y-4">
        <div className="relative">
          <div
            className="h-24 rounded-xl border border-border overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent}, oklch(70% 0.24 340))` }}
          />
          <div className="absolute -bottom-7 left-4 size-16 rounded-2xl bg-bg-elev ring-4 ring-bg-elev grid place-items-center font-display text-2xl tracking-tighter">
            {name.slice(0, 1).toUpperCase() || 'C'}
          </div>
        </div>

        <div className="pt-10 grid sm:grid-cols-2 gap-3">
          <Input label="Name" value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="Frontend Cult" />
          <Input label="URL slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
            leading={<span className="text-muted text-xs">/c/</span>} placeholder="frontend-cult" />
        </div>

        <Textarea placeholder="What's this community about?" value={description}
          onChange={(e) => setDescription(e.target.value)} className="min-h-20" />

        <div>
          <p className="text-2xs uppercase tracking-caps text-muted mb-2">Accent</p>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button key={a} onClick={() => setAccent(a)}
                className={cn(
                  'size-8 rounded-full border-2 transition',
                  accent === a ? 'border-fg scale-110' : 'border-transparent'
                )}
                style={{ background: a }} aria-label={a} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-2xs uppercase tracking-caps text-muted mb-2">Visibility</p>
          <div className="grid grid-cols-2 gap-2">
            {(['public', 'private'] as const).map((v) => (
              <button key={v} onClick={() => setVisibility(v)}
                className={cn(
                  'rounded-xl border p-3 text-left text-sm transition',
                  visibility === v ? 'border-accent bg-surface-2 shadow-glow' : 'border-border bg-surface'
                )}
              >
                <p className="font-medium capitalize">{v}</p>
                <p className="text-2xs text-muted">{v === 'public' ? 'Anyone can join' : 'Invite only'}</p>
              </button>
            ))}
          </div>
        </div>

        <Button variant="accent" magnetic className="w-full" loading={busy} onClick={create}
          disabled={!name.trim() || !slug.trim()}>
          Create community
        </Button>
      </div>
    </Modal>
  );
}

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
