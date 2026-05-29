'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';

function VerifyInner() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');

  useEffect(() => {
    if (!token) { setState('fail'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setState('ok'))
      .catch(() => setState('fail'));
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass-strong rounded-3xl p-7 sm:p-9 text-center">
        {state === 'loading' && (
          <>
            <Spinner size={32} className="mx-auto text-accent" />
            <h1 className="mt-6 font-display text-2xl tracking-tighter">Verifying your email…</h1>
          </>
        )}
        {state === 'ok' && (
          <>
            <motion.div
              initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto size-20 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow"
            >
              <Check size={32} className="text-accent-fg" />
            </motion.div>
            <h1 className="mt-6 font-display text-3xl tracking-tighter">Email verified.</h1>
            <p className="mt-2 text-sm text-muted">Your account is fully activated. Welcome aboard.</p>
            <Button variant="accent" size="lg" magnetic className="w-full mt-6" onClick={() => router.push('/feed')}>
              Enter WORK <ArrowRight size={16} />
            </Button>
          </>
        )}
        {state === 'fail' && (
          <>
            <div className="mx-auto size-20 rounded-2xl bg-danger/20 border border-danger/40 grid place-items-center">
              <X size={32} className="text-danger" />
            </div>
            <h1 className="mt-6 font-display text-3xl tracking-tighter">Link invalid or expired.</h1>
            <p className="mt-2 text-sm text-muted">Sign in and request a new verification email.</p>
            <Button asChild variant="accent" size="lg" magnetic className="w-full mt-6">
              <Link href="/login">Back to sign in <ArrowRight size={16} /></Link>
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyInner /></Suspense>;
}
