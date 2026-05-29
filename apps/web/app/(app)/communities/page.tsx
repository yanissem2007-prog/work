'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Users2, Globe, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import type { Community } from '@work/types';

export default function CommunitiesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const mine = useQuery<Community[]>({
    queryKey: ['communities', 'mine'],
    queryFn: async () => (await api.get('/communities/mine')).data.data
  });

  const discover = useQuery<Community[]>({
    queryKey: ['communities', 'discover', q],
    queryFn: async () => (await api.get('/communities', { params: { q } })).data.data
  });

  async function join(slug: string) {
    await api.post(`/communities/${slug}/join`);
    qc.invalidateQueries({ queryKey: ['communities'] });
    router.push(`/communities/${slug}`);
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-tighter">Communities</h1>
          <p className="text-sm text-muted mt-1">Find your people. Build with them.</p>
        </div>
        <Button variant="accent" magnetic onClick={() => setOpen(true)}>
          <Plus size={16} /> Create community
        </Button>
      </header>

      {mine.data && mine.data.length > 0 && (
        <section>
          <p className="text-eyebrow mb-3">Your communities</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mine.data.map((c) => <CommunityCard key={c._id} c={c} cta="Open" />)}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-eyebrow">Discover</p>
          <div className="w-full max-w-xs">
            <Input variant="glass" size="sm" leading={<Search size={14} />}
              placeholder="Search communities…"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {discover.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {discover.data?.map((c) => (
            <CommunityCard key={c._id} c={c} cta="Join" onJoin={() => join(c.slug)} />
          ))}
        </motion.div>
      </section>

      <CreateCommunityModal open={open} onOpenChange={setOpen} onCreated={(slug) => router.push(`/communities/${slug}`)} />
    </div>
  );
}

function CommunityCard({ c, cta, onJoin }: { c: Community; cta: string; onJoin?: () => void }) {
  return (
    <Card variant="glass" interactive tilt glow className="!p-0 overflow-hidden">
      <div
        className="h-20 relative"
        style={{ background: c.accent ? `linear-gradient(135deg, ${c.accent}, oklch(70% 0.24 340))` : undefined }}
      >
        {c.banner
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.banner} alt="" className="w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-grad-aurora animate-aurora" />
        }
      </div>
      <div className="p-4 -mt-8">
        <div className="size-14 rounded-2xl bg-bg-elev ring-4 ring-bg-elev grid place-items-center text-xl font-display tracking-tighter mb-3">
          {c.icon
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={c.icon} alt="" className="size-full rounded-2xl object-cover" />
            : c.name.slice(0, 1)}
        </div>
        <CardTitle className="text-base flex items-center gap-1.5">
          {c.name}
          {c.visibility === 'private' ? <Lock size={12} className="text-muted" /> : <Globe size={12} className="text-muted" />}
        </CardTitle>
        <CardDescription className="line-clamp-2 mt-1">{c.description ?? 'A community.'}</CardDescription>
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="soft" dot dotColor="var(--accent)">
            <Users2 size={11} /> {c.membersCount.toLocaleString()}
          </Badge>
          {onJoin ? (
            <Button size="sm" variant="accent" onClick={onJoin}>{cta}</Button>
          ) : (
            <Link href={`/communities/${c.slug}`}>
              <Button size="sm" variant="glass">{cta}</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
