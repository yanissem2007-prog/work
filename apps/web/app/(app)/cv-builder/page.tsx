'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FileText, Copy, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import type { Cv } from '@work/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelative } from '@/lib/utils';

export default function CvDashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: cvs = [], isLoading } = useQuery<Cv[]>({
    queryKey: ['cvs'],
    queryFn: async () => (await api.get('/cv')).data.data
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/cv', {})).data.data as Cv,
    onSuccess: (cv) => router.push(`/cv-builder/${cv._id}`)
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => api.post(`/cv/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] })
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/cv/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] })
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tighter">CV Builder</h1>
          <p className="text-sm text-muted mt-1">Build a CV that writes itself.</p>
        </div>
        <Button variant="accent" magnetic loading={create.isPending} onClick={() => create.mutate()}>
          <Plus size={14} /> New CV
        </Button>
      </header>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}

      {!isLoading && cvs.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <div className="mx-auto size-16 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow">
            <Sparkles size={22} className="text-accent-fg" />
          </div>
          <h2 className="mt-5 font-display text-2xl tracking-tighter">Your first CV in 5 minutes.</h2>
          <p className="text-sm text-muted mt-1">Pick a template. AI writes the bullets. Export PDF.</p>
          <Button variant="accent" magnetic className="mt-6" onClick={() => create.mutate()}>
            Create my CV
          </Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cvs.map((cv, i) => (
          <motion.div key={cv._id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <Card variant="glass" interactive tilt glow className="group !p-0 overflow-hidden">
              <button onClick={() => router.push(`/cv-builder/${cv._id}`)}
                className="block w-full">
                <div className="relative aspect-[3/4] overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${cv.accent}, oklch(70% 0.24 340))` }}>
                  <div className="absolute inset-3 rounded-lg bg-white/95 p-4 text-black overflow-hidden">
                    <div className="space-y-1.5">
                      <div className="h-2 w-24 bg-black rounded" />
                      <div className="h-1.5 w-32 bg-black/40 rounded" />
                    </div>
                    <div className="mt-3 space-y-1">
                      {[80, 60, 70, 50, 75].map((w, i) => (
                        <div key={i} className="h-1 bg-black/20 rounded" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className="mt-3 flex gap-1">
                      {[1,2,3,4].map((i) => <div key={i} className="h-1.5 w-8 bg-black/30 rounded" />)}
                    </div>
                  </div>
                </div>
              </button>

              <div className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{cv.title}</p>
                  <p className="text-2xs text-muted">Edited {formatRelative(cv.lastEditedAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="soft" className="capitalize">{cv.template}</Badge>
                </div>
              </div>

              <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <Button size="xs" variant="glass" onClick={() => duplicate.mutate(cv._id)}>
                  <Copy size={11} /> Duplicate
                </Button>
                {cv.publicSlug && (
                  <a href={`/cv/${cv.publicSlug}`} target="_blank" rel="noopener">
                    <Button size="xs" variant="glass"><ExternalLink size={11} /> Open</Button>
                  </a>
                )}
                <Button size="xs" variant="ghost" className="text-danger ml-auto"
                  onClick={() => confirm('Delete this CV?') && remove.mutate(cv._id)}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
