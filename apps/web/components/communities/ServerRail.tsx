'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { Community } from '@work/types';
import { cn } from '@/lib/utils';

interface Props { onCreate: () => void }

export function ServerRail({ onCreate }: Props) {
  const path = usePathname();
  const { data: mine = [] } = useQuery<Community[]>({
    queryKey: ['communities', 'mine'],
    queryFn: async () => (await api.get('/communities/mine')).data.data
  });

  return (
    <nav className="hidden md:flex w-16 shrink-0 flex-col items-center gap-2 py-3 border-r border-border bg-bg-elev/40">
      <Link href="/communities" className="relative group">
        <div className={cn(
          'size-11 rounded-2xl bg-surface grid place-items-center transition',
          path === '/communities' && 'bg-grad-accent text-accent-fg shadow-glow'
        )}>
          <Compass size={18} />
        </div>
      </Link>
      <div className="w-8 h-px bg-border my-1" />

      {mine.map((c) => {
        const active = path?.includes(`/communities/${c.slug}`);
        return (
          <Link key={c._id} href={`/communities/${c.slug}`} className="relative group">
            <motion.div
              whileHover={{ borderRadius: 16 }}
              className={cn(
                'size-11 grid place-items-center font-display text-lg overflow-hidden transition-all duration-fast',
                'rounded-3xl group-hover:rounded-2xl',
                active && 'rounded-2xl ring-2 ring-accent shadow-glow'
              )}
              style={{ background: c.accent ?? 'var(--surface-2)' }}
            >
              {c.icon
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={c.icon} alt="" className="size-full object-cover" />
                : <span className="text-white drop-shadow">{c.name.slice(0, 1).toUpperCase()}</span>}
            </motion.div>
            {active && (
              <motion.span layoutId="server-active"
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-7 bg-fg rounded-r" />
            )}
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs bg-bg-elev border border-border opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
              {c.name}
            </span>
          </Link>
        );
      })}

      <button onClick={onCreate}
        className="size-11 rounded-2xl border border-dashed border-border text-muted hover:border-accent hover:text-accent transition grid place-items-center"
        aria-label="Create community">
        <Plus size={16} />
      </button>
    </nav>
  );
}
