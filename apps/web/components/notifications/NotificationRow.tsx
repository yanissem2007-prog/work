'use client';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart, MessageCircle, UserPlus, MessageSquare, Briefcase, Calendar, Users2,
  Sparkles, Trophy, Bell, ShoppingBag, Star, AtSign, BellRing
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelative, cn } from '@/lib/utils';

const ICON: Record<string, LucideIcon> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  message: MessageSquare,
  chat_mention: AtSign,
  community_invited: Users2,
  community_announcement: BellRing,
  job_match: Sparkles,
  job_application: Briefcase,
  application_status: Briefcase,
  event_new: Calendar,
  event_reminder: BellRing,
  event_announcement: BellRing,
  event_cancelled: Calendar,
  order_new: ShoppingBag,
  order_delivered: ShoppingBag,
  order_completed: ShoppingBag,
  review_new: Star,
  badge_unlocked: Trophy,
  level_up: Trophy,
  system: Bell
};

const CATEGORY_TONE: Record<string, string> = {
  social: 'oklch(70% 0.24 340)',
  messages: 'oklch(72% 0.2 264)',
  jobs: 'oklch(78% 0.18 200)',
  events: 'oklch(75% 0.22 50)',
  communities: 'oklch(78% 0.22 142)',
  system: 'oklch(78% 0.06 0)'
};

interface Actor { handle?: string; name?: string; avatar?: string }

export interface NotificationRowData {
  _id: string;
  type: string; category: string;
  title?: string; body?: string;
  href?: string;
  groupCount: number;
  lastAt: string;
  read: boolean;
  actor?: Actor | null;
  actors?: Actor[];
}

interface Props {
  notif: NotificationRowData;
  onClick?: () => void;
  variant?: 'row' | 'dropdown';
}

export function NotificationRow({ notif, onClick, variant = 'row' }: Props) {
  const Icon = ICON[notif.type] ?? Bell;
  const tone = CATEGORY_TONE[notif.category] ?? 'var(--accent)';
  const grouped = notif.groupCount > 1;
  const visibleActors = (notif.actors ?? []).slice(0, 3);
  const headline = buildHeadline(notif, grouped, visibleActors);

  const Wrapper = notif.href ? (Link as any) : 'div';
  const wrapperProps = notif.href ? { href: notif.href, onClick } : { onClick };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'group block transition relative',
        variant === 'row'
          ? 'glass rounded-2xl p-4 hover-lift'
          : 'rounded-xl p-3 hover:bg-surface'
      )}
    >
      {!notif.read && (
        <span className="absolute top-3 right-3 size-2 rounded-full bg-accent shadow-glow" />
      )}

      <div className="flex items-start gap-3">
        {/* Stacked actor avatars or category icon */}
        <div className="relative shrink-0">
          {visibleActors.length > 0 ? (
            <div className="flex -space-x-2">
              {visibleActors.map((a, i) => (
                <div key={i} style={{ zIndex: 3 - i }}>
                  <Avatar src={a?.avatar} name={a?.name ?? '—'} size="sm" ring />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="size-9 rounded-xl grid place-items-center shadow-glow"
              style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}
            >
              <Icon size={14} />
            </div>
          )}
          {visibleActors.length > 0 && (
            <div
              className="absolute -bottom-1 -right-1 size-5 rounded-full grid place-items-center shadow-glow"
              style={{ background: tone }}
            >
              <Icon size={10} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm leading-snug', !notif.read && 'font-medium')}>
            {headline}
          </p>
          {notif.body && (
            <p className="mt-0.5 text-xs text-muted line-clamp-2">{notif.body}</p>
          )}
          <p className="mt-1 text-2xs text-muted">{formatRelative(notif.lastAt)}</p>
        </div>
      </div>
    </Wrapper>
  );
}

function buildHeadline(n: NotificationRowData, grouped: boolean, actors: Actor[]): React.ReactNode {
  const firstName = n.actor?.name ?? actors[0]?.name ?? 'Someone';
  const verb = n.title ?? n.type.replaceAll('_', ' ');

  if (!grouped) {
    return <><span className="font-medium">{firstName}</span> {verb}</>;
  }
  const others = n.groupCount - 1;
  return (
    <>
      <span className="font-medium">{firstName}</span>
      {' and '}<span className="font-medium">{others} other{others > 1 ? 's' : ''}</span>
      {' '}{verb}
    </>
  );
}
