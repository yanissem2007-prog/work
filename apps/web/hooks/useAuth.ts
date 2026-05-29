'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Role, User } from '@work/types';

export function useAuth({ required = false, roles }: { required?: boolean; roles?: Role[] } = {}) {
  const router = useRouter();
  const { user, accessToken, setUser } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    enabled: !!accessToken,
    queryFn: async () => (await api.get<{ data: User }>('/auth/me')).data.data,
    staleTime: 5 * 60_000
  });

  useEffect(() => { if (data) setUser(data); }, [data, setUser]);

  useEffect(() => {
    if (!required) return;
    if (!accessToken && !isLoading) router.replace('/login');
    if (roles && user && !roles.includes(user.role)) router.replace('/feed');
  }, [required, accessToken, isLoading, roles, user, router]);

  return { user: data ?? user, isLoading, error };
}
