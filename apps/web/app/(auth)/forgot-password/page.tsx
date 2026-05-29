'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } finally { setLoading(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass-strong rounded-3xl p-7 sm:p-9">
        {!sent ? (
          <>
            <h1 className="font-display text-3xl tracking-tighter">Forgot password?</h1>
            <p className="mt-2 text-sm text-muted">Enter your email and we'll send a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Input label="Email" type="email" leading={<Mail size={16} />}
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              <Button type="submit" variant="accent" size="lg" magnetic loading={loading} className="w-full">
                Send reset link <ArrowRight size={16} />
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto size-16 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow">
              <Check size={28} className="text-accent-fg" />
            </div>
            <h2 className="mt-6 font-display text-2xl tracking-tighter">Check your inbox.</h2>
            <p className="mt-2 text-sm text-muted">
              If <span className="text-fg">{email}</span> has an account, a reset link is on its way. Expires in 30 minutes.
            </p>
          </div>
        )}
        <p className="mt-7 text-center text-xs text-muted">
          <Link href="/login" className="text-fg underline-offset-4 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </motion.div>
  );
}
