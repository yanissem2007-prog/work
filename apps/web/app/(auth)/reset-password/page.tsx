'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error('At least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset. Please sign in.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Invalid or expired link');
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
        <h1 className="font-display text-3xl tracking-tighter">Set a new password</h1>
        <p className="mt-2 text-sm text-muted">Choose something strong and memorable.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input label="New password" type="password" leading={<Lock size={16} />}
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm password" type="password" leading={<Lock size={16} />}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" variant="accent" size="lg" magnetic loading={loading} className="w-full">
            Reset password <ArrowRight size={16} />
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/login" className="text-fg underline-offset-4 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
