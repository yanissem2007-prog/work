'use client';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

function OAuthInner() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setAccessToken);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('token');
    if (!token) { router.replace('/login?oauth=failed'); return; }
    setToken(token);
    api.get('/auth/me').then(({ data }) => {
      setUser(data.data);
      router.replace('/feed');
    }).catch(() => router.replace('/login?oauth=failed'));
  }, [router, setUser, setToken]);

  return (
    <main className="relative grid place-items-center min-h-dvh">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh aurora animate-aurora opacity-70" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong rounded-3xl p-10 text-center"
      >
        <Spinner size={28} className="mx-auto text-accent" />
        <p className="mt-4 text-sm text-muted">Signing you in…</p>
      </motion.div>
    </main>
  );
}

export default function OAuthCallback() { return <Suspense><OAuthInner /></Suspense>; }
