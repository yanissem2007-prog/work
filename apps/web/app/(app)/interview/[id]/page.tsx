'use client';
import { use, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mic, MicOff, SkipForward, Send, ArrowLeft, RotateCcw, Trophy, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Assistant } from '@/components/interview/Assistant';
import { ScoreCircle } from '@/components/cv-analyzer/ScoreCircle';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

interface Turn {
  _id?: string;
  question: string;
  kind?: 'open' | 'technical' | 'behavioral';
  answer?: string;
  feedback?: { confidence: number; vocabulary: number; technical: number; communication: number; clarity: number; overall: number; coach: string };
}

interface Session {
  _id: string;
  category: string; level: string; jobTitle?: string;
  totalQuestions: number;
  turns: Turn[];
  status: 'active' | 'completed' | 'abandoned';
  report?: { score: number; summary: string; strengths: string[]; weaknesses: string[]; improvements: string[] };
}

const DIMENSIONS = [
  { key: 'confidence', label: 'Confidence' },
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'technical',  label: 'Technical' },
  { key: 'communication', label: 'Communication' },
  { key: 'clarity',    label: 'Clarity' }
] as const;

export default function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const speech = useSpeechRecognition();
  const taRef = useRef<HTMLTextAreaElement>(null);

  const { data: session, isLoading, refetch } = useQuery<Session>({
    queryKey: ['interview', id],
    queryFn: async () => (await api.get(`/interview/${id}`)).data.data
  });

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<Turn['feedback'] | null>(null);

  // Mirror speech transcript into the textarea live (final segments only)
  useEffect(() => {
    if (speech.transcript) setAnswer((prev) => (prev ? prev + ' ' : '') + speech.transcript);
    if (speech.transcript) speech.reset();
  }, [speech.transcript]);

  if (isLoading || !session) return <div className="grid place-items-center py-20"><Spinner /></div>;

  if (session.status === 'completed') return <FinalReport session={session} />;

  const currentIdx = session.turns.length - 1;
  const current = session.turns[currentIdx];
  const totalAnswered = session.turns.filter((t) => t.answer !== undefined).length;
  const progress = totalAnswered / session.totalQuestions;

  async function submit() {
    const text = (answer + ' ' + speech.interim).trim();
    if (!text) return;
    setSubmitting(true);
    speech.stop();
    try {
      const r = await api.post(`/interview/${id}/answer`, { answer: text });
      setLastFeedback(r.data.data.feedback);
      setAnswer(''); speech.reset();
      qc.setQueryData(['interview', id], r.data.data.session);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setSubmitting(false); }
  }

  async function skip() {
    speech.stop();
    setAnswer(''); speech.reset();
    const r = await api.post(`/interview/${id}/skip`);
    qc.setQueryData(['interview', id], r.data.data);
  }

  const assistantState = submitting ? 'thinking' : speech.listening ? 'listening' : 'speaking';

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/interview" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Back
        </Link>
        <Badge variant="soft" className="capitalize">
          {session.category} · {session.level}
        </Badge>
        <Badge variant="accent" dot>
          Q{Math.min(currentIdx + 1, session.totalQuestions)} / {session.totalQuestions}
        </Badge>
      </header>

      {/* Progress rail */}
      <div className="h-1 bg-border rounded overflow-hidden">
        <motion.div
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-grad-accent origin-left shadow-glow"
        />
      </div>

      {/* Assistant + question */}
      <div className="grid lg:grid-cols-[180px_1fr] gap-6 items-start">
        <div className="justify-self-center lg:justify-self-start">
          <Assistant state={assistantState} size={160} />
        </div>

        <Card variant="glass" className="!p-6 min-h-[140px]">
          <p className="text-eyebrow mb-2 flex items-center gap-1.5">
            <Sparkles size={11} /> Question {currentIdx + 1}
            {current.kind && <span className="capitalize">· {current.kind}</span>}
          </p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={current.question}
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-2xl tracking-tight leading-snug"
            >
              {current.question}
            </motion.h2>
          </AnimatePresence>
        </Card>
      </div>

      {/* Last feedback (after each turn) */}
      <AnimatePresence>
        {lastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card variant="glass">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <p className="text-eyebrow flex items-center gap-1.5">
                  <TrendingUp size={11} /> Last answer · {lastFeedback.overall}/100
                </p>
                <button onClick={() => setLastFeedback(null)} className="text-2xs text-muted hover:text-fg">Dismiss</button>
              </div>
              <p className="text-sm text-fg-soft">{lastFeedback.coach}</p>

              <div className="mt-4 grid grid-cols-5 gap-2">
                {DIMENSIONS.map((d, i) => {
                  const v = (lastFeedback as any)[d.key] as number;
                  const tone = v >= 75 ? 'oklch(78% 0.22 142)' : v >= 55 ? 'oklch(78% 0.18 200)' : 'oklch(78% 0.18 70)';
                  return (
                    <div key={d.key}>
                      <div className="h-1.5 bg-surface-2 rounded overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${v}%` }}
                          transition={{ duration: 0.9, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full"
                          style={{ background: `linear-gradient(90deg, var(--accent), ${tone})`, boxShadow: `0 0 8px ${tone}` }}
                        />
                      </div>
                      <p className="mt-1 text-2xs text-muted">{d.label}</p>
                      <p className="text-xs font-medium tabular-nums" style={{ color: tone }}>{v}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <Card variant="glass">
        <div className="flex items-start gap-3">
          <button
            onClick={() => speech.listening ? speech.stop() : speech.start()}
            disabled={!speech.supported}
            aria-label={speech.listening ? 'Stop microphone' : 'Start microphone'}
            className={cn(
              'relative size-12 grid place-items-center rounded-2xl shrink-0 transition',
              speech.listening
                ? 'bg-grad-accent text-accent-fg shadow-glow'
                : 'bg-surface-2 hover:bg-surface text-fg'
            )}
          >
            {speech.listening && (
              <>
                <motion.span className="absolute inset-0 rounded-2xl bg-accent/40"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }} />
                <motion.span className="absolute inset-0 rounded-2xl bg-accent/30"
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }} />
              </>
            )}
            {speech.listening ? <Mic size={16} /> : <MicOff size={16} />}
          </button>

          <div className="flex-1 min-w-0">
            <textarea
              ref={taRef}
              value={answer + (speech.interim ? ' ' + speech.interim : '')}
              onChange={(e) => setAnswer(e.target.value.replace(speech.interim, ''))}
              placeholder={speech.supported ? 'Speak or type your answer…' : 'Type your answer (mic unavailable in this browser)…'}
              rows={4}
              className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed"
            />
            {speech.interim && <p className="text-xs text-muted italic">(listening: {speech.interim})</p>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <Button variant="glass" size="sm" onClick={skip} disabled={submitting}>
            <SkipForward size={13} /> Skip
          </Button>
          <Button
            variant="accent" size="lg" magnetic
            loading={submitting}
            disabled={!(answer + speech.interim).trim()}
            onClick={submit}
          >
            <Send size={14} /> Submit answer
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FinalReport({ session }: { session: Session }) {
  const r = session.report!;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <Link href="/interview" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> Back to setup
      </Link>

      <div className="glass-strong rounded-3xl p-6 sm:p-8 grid lg:grid-cols-[260px_1fr] gap-8 items-center">
        <div className="flex justify-center"><ScoreCircle value={r.score} /></div>
        <div>
          <p className="text-eyebrow mb-2 flex items-center gap-1.5">
            <Trophy size={11} /> Interview report
          </p>
          <h2 className="font-display text-2xl tracking-tighter leading-tight">{r.summary}</h2>
          <p className="mt-3 text-xs text-muted capitalize">
            {session.category} · {session.level} · {session.turns.filter((t) => t.answer).length}/{session.totalQuestions} answered
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/interview">
              <Button variant="accent" size="sm" magnetic><RotateCcw size={13} /> Train again</Button>
            </Link>
            <Link href="/jobs"><Button variant="glass" size="sm">Find jobs</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card variant="glass">
          <p className="text-eyebrow mb-2 flex items-center gap-1.5 text-success">
            <Sparkles size={11} /> Strengths
          </p>
          <ul className="space-y-1.5">
            {r.strengths.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-success shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="glass">
          <p className="text-eyebrow mb-2 flex items-center gap-1.5 text-warning">
            <AlertTriangle size={11} /> Weaknesses
          </p>
          <ul className="space-y-1.5">
            {r.weaknesses.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-warning shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="glass" className="sm:col-span-2">
          <p className="text-eyebrow mb-2 flex items-center gap-1.5 text-accent">
            <Lightbulb size={11} /> Improvements
          </p>
          <ul className="space-y-1.5">
            {r.improvements.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-grad-accent shrink-0 shadow-glow" /> {s}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Turn-by-turn */}
      <section>
        <p className="text-eyebrow mb-3">Turn by turn</p>
        <div className="space-y-3">
          {session.turns.map((t, i) => (
            <Card key={i} variant="glass">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs text-muted">Q{i + 1} · {t.kind ?? 'open'}</p>
                {t.feedback && <Badge variant="soft">{t.feedback.overall}/100</Badge>}
              </div>
              <p className="font-medium text-sm">{t.question}</p>
              {t.answer && <p className="mt-2 text-sm text-fg-soft whitespace-pre-wrap">{t.answer}</p>}
              {!t.answer && <p className="mt-2 text-xs text-muted italic">Skipped.</p>}
              {t.feedback?.coach && <p className="mt-2 text-2xs text-accent">✦ {t.feedback.coach}</p>}
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
