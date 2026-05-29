'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, ShieldCheck, RotateCcw, ArrowLeft, Sparkles, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/auth/OtpInput';
import { Particles } from '@/components/effects/Particles';
import { cn, formatRelative } from '@/lib/utils';

function VerifyInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const userId = sp.get('uid') ?? '';
  const emailMasked = sp.get('e') ?? '';
  const expiresAtIso = sp.get('exp') ?? '';
  const initialCooldown = Number(sp.get('cd') ?? '45');

  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setAccessToken);

  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [reason, setReason] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (!expiresAtIso) return 300;
    return Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000));
  });

  /* Countdown */
  useEffect(() => {
    if (!expiresAtIso) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000));
      setRemainingSec(left);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAtIso]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function submit() {
    if (code.length !== 6 || state === 'verifying') return;
    setState('verifying'); setReason(null);
    try {
      const r = await api.post('/auth/otp/login/verify', { userId, code });
      const data = r.data.data;
      if (data.ok) {
        setState('success');
        setToken(data.accessToken);
        setUser(data.user);
        setTimeout(() => router.push('/home'), 700);
      } else {
        setState('error');
        setReason(data.reason ?? 'Wrong code');
      }
    } catch (e: any) {
      setState('error');
      setReason(e?.response?.data?.error?.message ?? 'Verification failed');
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    try {
      const r = await api.post('/auth/otp/resend', { userId });
      const data = r.data.data;
      setCooldown(45);
      setCode(''); setState('idle'); setReason(null);
      // Pull fresh expiry by replacing the URL query
      const url = new URL(window.location.href);
      url.searchParams.set('exp', new Date(data.expiresAt).toISOString());
      url.searchParams.set('cd', String(data.cooldownSec));
      window.history.replaceState(null, '', url.toString());
      toast.success('New code sent');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not resend');
    }
  }

  if (!userId) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="w-full max-w-md text-center">
        <div className="glass-strong rounded-3xl p-8">
          <p className="text-muted text-sm">No active verification session.</p>
          <Link href="/login" className="text-accent hover:underline text-sm">Back to sign in</Link>
        </div>
      </motion.div>
    );
  }

  const mm = Math.floor(remainingSec / 60);
  const ss = String(remainingSec % 60).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-md"
    >
      <Particles density={18} className="fixed inset-0 -z-10" />

      <Link href="/login"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
        <ArrowLeft size={12} /> Back to sign in
      </Link>

      <div className="relative glass-strong rounded-3xl overflow-hidden">
        {/* Aurora top edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-grad-accent shadow-glow opacity-80" />

        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-10 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow">
              <ShieldCheck size={16} className="text-accent-fg" />
            </div>
            <div>
              <p className="text-2xs uppercase tracking-caps text-accent">Secure verification</p>
              <h1 className="font-display text-2xl tracking-tighter">Check your inbox.</h1>
            </div>
          </div>

          <p className="text-sm text-muted mt-3 flex items-center gap-1.5">
            <Mail size={13} /> Code sent to <span className="text-fg">{emailMasked}</span>
          </p>

          {/* OTP */}
          <div className="mt-7">
            <OtpInput
              value={code}
              onChange={(v) => { setCode(v); if (state !== 'idle') setState('idle'); }}
              state={state}
              autoSubmit={submit}
            />
          </div>

          {/* Status row */}
          <AnimatePresence mode="wait">
            {state === 'verifying' && (
              <motion.p key="ver" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 text-center text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={11} className="text-accent animate-pulse" /> Verifying…
                </span>
              </motion.p>
            )}
            {state === 'success' && (
              <motion.p key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 text-center text-sm text-success">
                <span className="inline-flex items-center gap-1.5">
                  <Check size={13} /> Verified — entering WORK
                </span>
              </motion.p>
            )}
            {state === 'error' && reason && (
              <motion.p key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 text-center text-sm text-danger">
                <span className="inline-flex items-center gap-1.5">
                  <X size={13} /> {reason}
                </span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Countdown + resend */}
          <div className="mt-6 flex items-center justify-between text-2xs text-muted">
            <span className="tabular-nums">
              {remainingSec > 0 ? `Expires in ${mm}:${ss}` : 'Code expired'}
            </span>
            <button onClick={resend} disabled={cooldown > 0}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-pill transition',
                cooldown > 0 ? 'opacity-40 cursor-not-allowed' : 'text-accent hover:underline'
              )}>
              <RotateCcw size={11} /> Resend{cooldown > 0 ? ` in ${cooldown}s` : ''}
            </button>
          </div>

          <Button
            variant="accent" size="lg" magnetic
            className="w-full mt-6"
            disabled={code.length !== 6 || state === 'verifying' || state === 'success'}
            loading={state === 'verifying'}
            onClick={submit}
          >
            Verify & continue
          </Button>

          <p className="mt-4 text-[10px] text-center text-muted">
            Never share this code. WORK staff will never ask for it.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function VerifyOtpPage() {
  return <Suspense><VerifyInner /></Suspense>;
}
