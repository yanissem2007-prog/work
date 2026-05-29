'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Job } from '@work/types';
import { fmtSalary } from './JobCard';

interface Props {
  job: Job;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApplied: () => void;
}

export function ApplyDrawer({ job, open, onOpenChange, onApplied }: Props) {
  const user = useAuthStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cvUrl, setCvUrl] = useState('');
  const [cvName, setCvName] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const { data: sig } = await api.post('/media/sign', { folder: 'cvs' });
      const s = sig.data;
      const form = new FormData();
      form.append('file', file); form.append('api_key', s.apiKey);
      form.append('timestamp', String(s.timestamp));
      form.append('signature', s.signature); form.append('folder', s.folder);
      const r = await fetch(s.uploadUrl, { method: 'POST', body: form });
      const j = await r.json();
      if (j.secure_url) { setCvUrl(j.secure_url); setCvName(file.name); }
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function submit() {
    setSubmitting(true);
    try {
      await api.post(`/jobs/${job._id}/apply`, { cvUrl: cvUrl || undefined, coverLetter: coverLetter || undefined });
      toast.success('Application sent!');
      onApplied(); onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not apply');
    } finally { setSubmitting(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Apply · ${job.title}`} side="right" size="lg">
      <div className="space-y-5 px-1">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name ?? 'You'} ring />
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-muted">{user?.headline ?? `@${user?.handle}`}</p>
          </div>
        </div>

        <section>
          <p className="text-eyebrow mb-2">Position</p>
          <div className="glass rounded-2xl p-4">
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-muted">{job.company?.name} · {job.location ?? (job.remote ? 'Remote' : '—')}</p>
            {(job.salaryMin || job.salaryMax) && (
              <p className="mt-1 text-sm font-medium">{fmtSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
            )}
          </div>
        </section>

        <section>
          <p className="text-eyebrow mb-2">CV</p>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-surface-2 transition"
          >
            <div className="size-10 rounded-xl bg-grad-accent grid place-items-center shrink-0">
              {uploading ? <Loader2 size={16} className="animate-spin text-accent-fg" /> : <FileText size={16} className="text-accent-fg" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{cvName || 'Upload your CV'}</p>
              <p className="text-2xs text-muted">PDF, DOC, DOCX · up to 10 MB</p>
            </div>
            <Upload size={14} className="text-muted" />
          </button>
        </section>

        <section>
          <p className="text-eyebrow mb-2">Cover letter (optional)</p>
          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder={`Why ${job.company?.name ?? 'this team'}?`}
            className="min-h-40"
          />
          <p className="mt-1 text-2xs text-muted text-right">{coverLetter.length} / 4000</p>
        </section>

        <Button variant="accent" size="lg" magnetic loading={submitting}
          onClick={submit} className="w-full">
          Submit application
        </Button>
      </div>
    </Sheet>
  );
}
