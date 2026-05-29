'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Github, Star, GitFork, Calendar, ExternalLink, Sparkles, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
}

interface RepoMeta {
  owner: string; name: string; description: string | null; language: string | null;
  stars: number; forks: number; topics: string[]; homepage: string | null;
  pushedAt: string; htmlUrl: string; readmeExcerpt: string | null;
}

export function GithubConnectModal({ open, onOpenChange, projectId }: Props) {
  const qc = useQueryClient();
  const [repo, setRepo] = useState('');
  const [meta, setMeta] = useState<RepoMeta | null>(null);

  const preview = useMutation({
    mutationFn: async () => (await api.post('/projects/github/preview', { repo })).data.data as RepoMeta,
    onSuccess: (m) => setMeta(m),
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Could not load repo')
  });

  const attach = useMutation({
    mutationFn: async () => (await api.post(`/projects/${projectId}/github`, { repo })).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-ideas'] });
      toast.success('GitHub repo attached');
      setRepo(''); setMeta(null);
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Failed')
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Connect GitHub repo" size="md"
      description="Paste a URL or owner/repo — I'll auto-fill stack, topics, and demo link.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input variant="glass" size="lg" placeholder="vercel/next.js  or  https://github.com/…"
            value={repo} onChange={(e) => { setRepo(e.target.value); setMeta(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') preview.mutate(); }}
            leading={<Github size={14} />} className="flex-1" />
          <Button variant="glass" onClick={() => preview.mutate()} loading={preview.isPending} disabled={!repo.trim()}>
            Preview
          </Button>
        </div>

        <AnimatePresence>
          {meta && (
            <motion.div
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-border bg-bg-elev/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg tracking-tighter">{meta.owner}/{meta.name}</p>
                  {meta.description && <p className="text-sm text-muted mt-0.5">{meta.description}</p>}
                </div>
                <a href={meta.htmlUrl} target="_blank" rel="noopener"
                  className="text-muted hover:text-fg p-1" aria-label="Open on GitHub">
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Star size={11} className="text-warning" /> {meta.stars.toLocaleString()}</span>
                <span className="flex items-center gap-1"><GitFork size={11} /> {meta.forks.toLocaleString()}</span>
                {meta.language && <span>· {meta.language}</span>}
                <span className="flex items-center gap-1"><Calendar size={11} /> Updated {formatRelative(meta.pushedAt)}</span>
              </div>

              {meta.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {meta.topics.slice(0, 8).map((t) => <Badge key={t} variant="soft">{t}</Badge>)}
                </div>
              )}

              {meta.readmeExcerpt && (
                <div className="mt-3 rounded-xl bg-surface p-3 border border-border">
                  <p className="text-2xs uppercase tracking-caps text-muted mb-1.5">README excerpt</p>
                  <p className="text-xs text-fg-soft line-clamp-6 whitespace-pre-wrap">{meta.readmeExcerpt}</p>
                </div>
              )}

              <Button variant="accent" size="lg" magnetic loading={attach.isPending}
                onClick={() => attach.mutate()} className="w-full mt-4">
                <Check size={14} /> Attach to project <Sparkles size={13} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!meta && (
          <p className="text-2xs text-muted">
            Tip: set <code className="text-fg">GITHUB_TOKEN</code> on the API to lift the public rate limit.
          </p>
        )}
      </div>
    </Modal>
  );
}
