'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/home';
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setAccessToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle OTP on/off via env. In dev it's off by default → instant login.
  const otpEnabled = process.env.NEXT_PUBLIC_OTP_LOGIN === 'true';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (otpEnabled) {
        // Two-step: credentials → email OTP
        const { data } = await api.post('/auth/otp/login/start', { email, password });
        const d = data.data;
        const params = new URLSearchParams({
          uid: d.userId, e: d.emailMasked,
          exp: new Date(d.expiresAt).toISOString(),
          cd: String(d.cooldownSec), next
        });
        router.push(`/verify-otp?${params.toString()}`);
      } else {
        // Direct login (dev): email + password → tokens immediately
        const { data } = await api.post('/auth/login', { email, password });
        setToken(data.data.accessToken);
        setUser(data.data.user);
        router.push(next);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass-strong rounded-3xl p-7 sm:p-9">
        <h1 className="font-display text-3xl tracking-tighter">Welcome back.</h1>
        <p className="mt-2 text-sm text-muted">Sign in to continue your career.</p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <Input label="Email" type="email" leading={<Mail size={16} />}
            value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Input label="Password" type="password" leading={<Lock size={16} />}
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="text-right text-xs">
            <Link href="/forgot-password" className="text-muted hover:text-fg">Forgot password?</Link>
          </div>
          <Button type="submit" variant="accent" size="lg" magnetic loading={loading} className="w-full mt-2">
            Sign in <ArrowRight size={16} />
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-2xs uppercase tracking-caps text-muted">
          <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
        </div>
        <div className="mt-4"><OAuthButtons /></div>

        <p className="mt-7 text-center text-xs text-muted">
          New here? <Link href="/register" className="text-fg underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </div>
    </motion.div>
  );
}
