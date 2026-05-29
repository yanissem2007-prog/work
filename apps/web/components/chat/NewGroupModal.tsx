'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import type { User } from '@work/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (roomId: string) => void;
}

export function NewGroupModal({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState<'members' | 'meta'>('members');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: friends } = useQuery<User[]>({
    enabled: open,
    queryKey: ['friends'],
    queryFn: async () => (await api.get('/users/friends')).data.data
  });

  const list = (friends ?? []).filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()));

  function toggle(u: User) {
    setSelected((arr) => arr.find((x) => x.id === u.id) ? arr.filter((x) => x.id !== u.id) : [...arr, u]);
  }

  async function create() {
    if (!name.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      const r = await api.post('/chat/rooms/group', { name, memberIds: selected.map((u) => u.id) });
      onCreated(r.data.data.id);
      reset();
      onOpenChange(false);
    } catch { toast.error('Could not create group'); }
    finally { setBusy(false); }
  }

  function reset() { setStep('members'); setSelected([]); setName(''); setQ(''); }

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      title={step === 'members' ? 'New group' : 'Name your group'}
      description={step === 'members' ? `${selected.length} selected` : undefined}
      size="md"
    >
      {step === 'members' ? (
        <>
          <Input variant="glass" leading={<Search size={14} />}
            placeholder="Search friends…" value={q} onChange={(e) => setQ(e.target.value)} />

          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <button key={u.id} onClick={() => toggle(u)}
                  className="glass rounded-pill px-2 py-1 text-xs flex items-center gap-1.5">
                  <Avatar src={u.avatar} name={u.name} size="xs" /> {u.name}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-4 max-h-80 overflow-y-auto -mx-2">
            {list.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted">No friends yet.</li>}
            {list.map((u) => {
              const checked = !!selected.find((x) => x.id === u.id);
              return (
                <li key={u.id}>
                  <button
                    onClick={() => toggle(u)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-xl transition',
                      checked ? 'bg-surface-2' : 'hover:bg-surface'
                    )}
                  >
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-2xs text-muted">@{u.handle}</p>
                    </div>
                    <span className={cn(
                      'size-5 rounded-full border grid place-items-center transition',
                      checked ? 'bg-accent border-accent text-accent-fg' : 'border-border'
                    )}>
                      {checked && <Check size={12} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Button
            variant="accent" magnetic className="w-full mt-5"
            disabled={selected.length === 0}
            onClick={() => setStep('meta')}
          >Next</Button>
        </>
      ) : (
        <>
          <Input label="Group name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          <p className="mt-3 text-xs text-muted">{selected.length} members will be invited.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="glass" onClick={() => setStep('members')}>Back</Button>
            <Button variant="accent" magnetic loading={busy} className="flex-1" onClick={create}>
              Create group
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
