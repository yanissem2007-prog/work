'use client';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Cloud, Plus, Eye, Printer, Share2, Sparkles, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Cv, CvSection, CvSectionType, CvTemplate } from '@work/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { SectionEditor } from '@/components/cv/SectionEditor';
import { TEMPLATES_MAP } from '@/components/cv/templates';
import { cn } from '@/lib/utils';

const TEMPLATES: { id: CvTemplate; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'brutalist', label: 'Brutalist' },
  { id: 'mono', label: 'Mono' }
];

const ACCENTS = [
  'oklch(62% 0.22 264)', 'oklch(70% 0.24 340)', 'oklch(80% 0.14 200)',
  'oklch(72% 0.2 142)', 'oklch(75% 0.22 50)', 'oklch(18% 0 0)'
];

const ADDABLE: { type: CvSectionType; label: string }[] = [
  { type: 'certifications', label: 'Certifications' },
  { type: 'languages', label: 'Languages' },
  { type: 'projects', label: 'Projects' },
  { type: 'links', label: 'Links' }
];

export default function CvEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: initial, isLoading } = useQuery<Cv>({
    queryKey: ['cv', id],
    queryFn: async () => (await api.get(`/cv/${id}`)).data.data
  });

  const [cv, setCv] = useState<Cv | null>(null);
  useEffect(() => { if (initial && !cv) setCv(initial); }, [initial, cv]);

  // Autosave (debounced)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const dirtyRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!cv || !dirtyRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState('saving');
    timerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/cv/${cv._id}`, {
          title: cv.title, template: cv.template, accent: cv.accent, sections: cv.sections
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1200);
      } catch { toast.error('Auto-save failed'); setSaveState('idle'); }
    }, 800);
  }, [cv]);

  function update<K extends keyof Cv>(key: K, value: Cv[K]) {
    if (!cv) return;
    dirtyRef.current = true;
    setCv({ ...cv, [key]: value });
  }

  function patchSection(id: string, next: CvSection) {
    if (!cv) return;
    dirtyRef.current = true;
    setCv({ ...cv, sections: cv.sections.map((s) => s.id === id ? next : s) });
  }

  function removeSection(id: string) {
    if (!cv) return;
    dirtyRef.current = true;
    setCv({ ...cv, sections: cv.sections.filter((s) => s.id !== id) });
  }

  function addSection(type: CvSectionType) {
    if (!cv) return;
    const titles: Record<CvSectionType, string> = {
      personal: 'Personal', summary: 'Summary', experience: 'Experience',
      education: 'Education', skills: 'Skills', projects: 'Projects',
      certifications: 'Certifications', languages: 'Languages', links: 'Links'
    };
    dirtyRef.current = true;
    setCv({
      ...cv,
      sections: [...cv.sections, {
        id: crypto.randomUUID(), type, title: titles[type], visible: true, items: [], content: ''
      }]
    });
  }

  function reorder(newOrder: CvSection[]) {
    if (!cv) return;
    dirtyRef.current = true;
    setCv({ ...cv, sections: newOrder });
  }

  function exportPdf() {
    // Use browser print (CSS @page handles paper size)
    window.print();
  }

  async function share() {
    const r = await api.post(`/cv/${id}/publish`);
    const url = `${window.location.origin}/cv/${r.data.data.publicSlug}`;
    await navigator.clipboard.writeText(url);
    toast.success('Public link copied');
  }

  if (isLoading || !cv) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const Template = TEMPLATES_MAP[cv.template];
  const addable = ADDABLE.filter((a) => !cv.sections.some((s) => s.type === a.type));

  return (
    <div className="-mx-4 sm:-mx-6 -my-6 h-[100dvh] flex flex-col">
      {/* Toolbar */}
      <header className="h-14 px-4 border-b border-border flex items-center gap-3 backdrop-blur-md bg-bg/70 sticky top-0 z-20">
        <button onClick={() => router.push('/cv-builder')} className="p-1.5 rounded-lg hover:bg-surface text-muted">
          <ArrowLeft size={16} />
        </button>
        <input
          value={cv.title}
          onChange={(e) => update('title', e.target.value)}
          className="bg-transparent text-sm font-medium outline-none min-w-0 flex-1"
        />
        <div className="flex items-center gap-2 text-2xs text-muted">
          {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
          {saveState === 'saved' && <><Check size={11} className="text-success" /> Saved</>}
          {saveState === 'idle' && <><Cloud size={11} /> All changes saved</>}
        </div>

        <Button size="sm" variant="glass" onClick={share}><Share2 size={13} /> Share</Button>
        <Button size="sm" variant="accent" magnetic onClick={exportPdf}>
          <Printer size={13} /> Export PDF
        </Button>
      </header>

      <div className="flex-1 grid lg:grid-cols-[420px_1fr] overflow-hidden">
        {/* Left — editor */}
        <aside className="overflow-y-auto border-r border-border p-4 space-y-4 no-print">
          {/* Template / accent */}
          <section className="glass rounded-2xl p-4">
            <p className="text-eyebrow mb-3">Template</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => {
                const active = cv.template === t.id;
                return (
                  <button key={t.id} onClick={() => update('template', t.id)}
                    className={cn(
                      'relative h-20 rounded-xl border overflow-hidden text-xs font-medium transition',
                      active ? 'border-accent shadow-glow' : 'border-border hover:border-border-strong'
                    )}>
                    <span className="absolute inset-0 bg-grad-mesh opacity-30" />
                    <span className="absolute bottom-2 left-2 z-10">{t.label}</span>
                    {active && <Check size={12} className="absolute top-2 right-2 text-accent z-10" />}
                  </button>
                );
              })}
            </div>

            <p className="text-eyebrow mt-4 mb-2">Accent</p>
            <div className="flex gap-2">
              {ACCENTS.map((a) => (
                <button key={a} onClick={() => update('accent', a)}
                  className={cn(
                    'size-7 rounded-full border-2 transition',
                    cv.accent === a ? 'border-fg scale-110' : 'border-transparent'
                  )}
                  style={{ background: a }} aria-label={a} />
              ))}
            </div>
          </section>

          {/* Sections — drag-reorder */}
          <Reorder.Group axis="y" values={cv.sections} onReorder={reorder} className="space-y-2.5">
            {cv.sections.map((s) => (
              <Reorder.Item key={s.id} value={s}
                className="cursor-default"
                whileDrag={{ scale: 1.02, boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.4)' }}
              >
                <SectionEditor
                  section={s}
                  onChange={(next) => patchSection(s.id, next)}
                  onRemove={() => removeSection(s.id)}
                  dragHandle={
                    <span className="cursor-grab active:cursor-grabbing text-muted hover:text-fg p-1">
                      <GripVertical size={14} />
                    </span>
                  }
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Add section */}
          {addable.length > 0 && (
            <section className="glass rounded-2xl p-4">
              <p className="text-eyebrow mb-3">Add section</p>
              <div className="grid grid-cols-2 gap-2">
                {addable.map((a) => (
                  <Button key={a.type} size="xs" variant="glass" onClick={() => addSection(a.type)}>
                    <Plus size={11} /> {a.label}
                  </Button>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Right — live preview */}
        <main className="overflow-y-auto bg-neutral-200/40 dark:bg-neutral-900/50 p-6 grid place-items-start justify-center print:bg-white print:p-0">
          <motion.div
            layout
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="cv-page bg-white text-black shadow-xl"
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={cv.template}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}>
                <Template cv={cv} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .cv-page { box-shadow: none !important; width: 100% !important; }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </div>
  );
}
