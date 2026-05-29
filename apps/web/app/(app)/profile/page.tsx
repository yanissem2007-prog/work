'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

export default function MyProfileRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user?.handle) router.replace(`/profile/${user.handle}`);
  }, [user, router]);
  return <div className="grid place-items-center py-20"><Spinner /></div>;
}
