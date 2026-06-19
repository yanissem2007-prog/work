'use client';
import { useState } from 'react';
import { Hash, Megaphone, BookOpen, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { ChannelType } from '@work/types';
import { cn } from '@/lib/utils';

const TYPES: { id: ChannelType; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'text', label: 'Text', desc: 'Free-form conversation', icon: Hash },
  { id: 'announcement', label: 'Announcement', desc: 'Read-only for members', icon: Megaphone },
  { id: 'resource', label: 'Resources', desc: 'Links, docs, references', icon: BookOpen },
  { id: 'event', label: 'Event', desc: 'Schedule + RSVP', icon: Calendar }
];

export function CreateChannelModal({ open, onOpenChange, slug, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; slug: string; onCreated: () => void;
}) {
  const [type, setType] = useState<ChannelType>('text');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post(`/communities/${slug}/channels`, { name, type, topic });
      onCreated(); onOpenChange(false); setName(''); setTopic(''); setType('text');
    } catch (e: any) { toast.error(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create a channel" size="md">
      <div className="space-y-4">
        <div>
          <p className="text-2xs uppercase tracking-caps text-muted mb-2">Type</p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border text-left transition',
                    active ? 'border-accent bg-surface-2 shadow-glow' : 'border-border bg-surface'
                  )}>
                  <t.icon size={16} />
                  <div>
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-2xs text-muted">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <Input label="Channel name" value={name} onChange={(e) => setName(e.target.value)} placeholder="general" />
        <Input label="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <Button variant="accent" magnetic loading={busy} onClick={submit} disabled={!name.trim()} className="w-full">
          Create channel
        </Button>
      </div>
    </Modal>
  );
}
