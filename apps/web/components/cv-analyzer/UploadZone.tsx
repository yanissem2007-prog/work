'use client';
import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  busy: boolean;
  onFile: (file: File) => void;
}

export function UploadZone({ busy, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handle = useCallback((f: File | null) => {
    if (!f) return;
    if (f.type !== 'application/pdf') return;
    setFile(f); onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files[0]); }}
      className={cn(
        'relative rounded-3xl border-2 border-dashed transition-colors duration-fast overflow-hidden',
        dragOver ? 'border-accent bg-surface-2' : 'border-border bg-bg-elev/30 hover:border-border-strong'
      )}
    >
      {/* Aurora wash */}
      <div className={cn(
        'absolute inset-0 -z-10 mesh aurora opacity-0 transition-opacity duration-normal',
        (dragOver || busy) && 'opacity-60 animate-aurora'
      )} />
      <div className="absolute inset-0 -z-10 noise opacity-30" />

      <input
        ref={inputRef} type="file" accept="application/pdf"
        className="hidden" onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full p-10 sm:p-14 flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="size-16 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow"
        >
          {busy ? <Loader2 size={22} className="animate-spin text-accent-fg" /> : <Upload size={22} className="text-accent-fg" />}
        </motion.div>

        <h2 className="mt-5 font-display text-2xl tracking-tighter">
          {busy ? 'Analyzing your CV…' : file ? file.name : 'Drop your CV here'}
        </h2>
        <p className="mt-2 text-sm text-muted max-w-sm">
          {busy
            ? 'Parsing the document, scoring 7 dimensions, drafting suggestions.'
            : 'PDF only, up to 8 MB. We never share your CV.'}
        </p>

        {!busy && !file && (
          <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-accent">
            <Sparkles size={12} /> Get a score in under 10 seconds
          </div>
        )}
      </button>

      <AnimatePresence>
        {file && !busy && (
          <motion.div
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="border-t border-border p-3 flex items-center gap-3"
          >
            <div className="size-9 rounded-lg bg-surface grid place-items-center">
              <FileText size={14} className="text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-2xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
              className="size-8 grid place-items-center rounded-full hover:bg-surface text-muted">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
