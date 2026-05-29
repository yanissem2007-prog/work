'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Sparkles, Briefcase, Users, User as UserIcon, Building2, MessageSquare, Calendar, ShoppingBag, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

type Type = 'jobs' | 'users' | 'companies' | 'communities' | 'posts' | 'events' | 'gigs';

const TYPES: { id: Type; label: string; icon: React.ComponentType<{ size?: number }>; tone: string }[] = [
  { id: 'jobs',        label: 'Jobs',        icon: Briefcase,      tone: 'oklch(78% 0.18 200)' },
  { id: 'users',       label: 'People',      icon: UserIcon,       tone: 'oklch(72% 0.2 264)' },
  { id: 'companies',   label: 'Companies',   icon: Building2,      tone: 'oklch(78% 0.22 142)' },
  { id: 'communities', label: 'Communities', icon: Users,          tone: 'oklch(70% 0.24 340)' },
  { id: 'posts',       label: 'Posts',       icon: MessageSquare,  tone: 'oklch(75% 0.22 50)' },
  { id: 'events',      label: 'Events',      icon: Calendar,       tone: 'oklch(78% 0.18 70)' },
  { id: 'gigs',        label: 'Gigs',        icon: ShoppingBag,    tone: 'oklch(72% 0.2 320)' }
];

interface Hit {
  type: Type; id: string;
  title: string; subtitle?: string; description?: string; image?: string; href: string; score: number;
  meta?: Record<string, unknown>;
}

interface Result {
  q: string;
  groups: Record<Type, Hit[]>;
  total: number;
  intent?: { primaryType?: Type; filters?: Record<string, unknown>; rewrittenQuery?: string };
}

function SearchInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const debounced = useDebounce(q, 200);
  const [activeType, setActiveType] = useState<Type | 'all'>('all');
  const [aiMode, setAiMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.replace(`/search?${params.toString()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const result = useQuery<Result>({
    enabled: debounced.trim().length >= 2,
    queryKey: ['search', debounced, aiMode],
    queryFn: async () =>
      aiMode
        ? (await api.post('/search/ai', { q: debounced })).data.data
        : (await api.get('/search', { params: { q: debounced } })).data.data
  });

  const groups = result.data?.groups;
  const total = result.data?.total ?? 0;
  const intent = result.data?.intent;

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl glass-strong overflow-hidden p-6 sm:p-8"
      >
        <div className="absolute inset-0 -z-10 mesh aurora animate-aurora opacity-50" />
        <div className="absolute inset-0 -z-10 noise opacity-40" />
        <div className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-caps px-3 py-1 rounded-pill bg-accent/10 text-accent">
          <Search size={11} /> Universal search
        </div>
        <h1 className="mt-3 font-display text-3xl md:text-4xl tracking-tightest">
          Find <span className="gradient-text italic">anything</span> on WORK.
        </h1>

        <div className="mt-5 flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[260px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input variant="glass" size="lg" autoFocus
              placeholder="Senior frontend engineer remote in EMEA"
              className="pl-10"
              value={q} onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            variant={aiMode ? 'accent' : 'glass'} size="lg"
            magnetic={aiMode}
            onClick={() => setAiMode((v) => !v)}>
            <Sparkles size={14} /> AI mode {aiMode ? 'on' : 'off'}
          </Button>
        </div>

        {aiMode && intent && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="soft" dot dotColor="var(--accent)">
              <Sparkles size={11} /> AI understood
            </Badge>
            {intent.primaryType && <Badge variant="soft" className="capitalize">type: {intent.primaryType}</Badge>}
            {intent.rewrittenQuery && <Badge variant="soft">rewritten: {intent.rewrittenQuery}</Badge>}
            {Object.entries(intent.filters ?? {}).map(([k, v]) => (
              <Badge key={k} variant="soft">{k}: {String(v)}</Badge>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* Type filter chips */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        <Chip active={activeType === 'all'} label={`All${total ? ` · ${total}` : ''}`}
          onClick={() => setActiveType('all')} />
        {TYPES.map((t) => (
          <Chip key={t.id}
            active={activeType === t.id}
            label={`${t.label}${groups?.[t.id]?.length ? ` · ${groups[t.id].length}` : ''}`}
            icon={t.icon}
            onClick={() => setActiveType(t.id)} />
        ))}
      </div>

      {result.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!result.isLoading && total === 0 && q.trim().length >= 2 && (
        <Card variant="glass" className="text-center py-16">
          <Search size={26} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">No results for "{q}".</p>
          <p className="text-xs text-muted mt-1">Try the AI mode for natural language queries.</p>
        </Card>
      )}

      {/* Grouped results */}
      <div className="space-y-6">
        {TYPES.filter((t) => activeType === 'all' || activeType === t.id).map((t) => {
          const hits = groups?.[t.id] ?? [];
          if (hits.length === 0) return null;
          return (
            <section key={t.id}>
              <header className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-xl grid place-items-center shadow-glow"
                  style={{ background: `linear-gradient(135deg, ${t.tone}, var(--accent))` }}>
                  <t.icon size={13} />
                </div>
                <h2 className="font-display tracking-tighter">{t.label}</h2>
                <span className="text-2xs text-muted ml-auto">{hits.length} result{hits.length === 1 ? '' : 's'}</span>
              </header>
              <div className="grid sm:grid-cols-2 gap-3">
                {hits.map((h, i) => (
                  <motion.div key={h.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}>
                    <Link href={h.href}>
                      <Card variant="glass" interactive className="hover-lift !p-0 overflow-hidden h-full">
                        <div className="p-4 flex items-start gap-3">
                          {h.image ? (
                            <div className="size-10 rounded-lg overflow-hidden border border-border shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={h.image} alt="" className="size-full object-cover" />
                            </div>
                          ) : (
                            <div className="size-10 rounded-lg shadow-glow grid place-items-center shrink-0"
                              style={{ background: `linear-gradient(135deg, ${t.tone}, var(--accent))` }}>
                              <t.icon size={13} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 leading-snug">{h.title}</p>
                            {h.subtitle && <p className="text-2xs text-muted truncate mt-0.5">{h.subtitle}</p>}
                          </div>
                          <ArrowRight size={14} className="text-muted self-center" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick, icon: Icon }:
  { label: string; active: boolean; onClick: () => void; icon?: React.ComponentType<{ size?: number }> }) {
  return (
    <button onClick={onClick}
      className={cn(
        'rounded-pill px-3 py-1 text-xs border transition shrink-0 inline-flex items-center gap-1.5',
        active ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
      )}>
      {Icon && <Icon size={11} />}
      {label}
    </button>
  );
}

export default function SearchPage() {
  return <Suspense><SearchInner /></Suspense>;
}
