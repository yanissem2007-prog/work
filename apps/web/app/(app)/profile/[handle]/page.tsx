'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Link as LinkIcon, Briefcase, GraduationCap, Image as ImageIcon, FileText, CheckCircle2, MessageSquare, UserPlus, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Post, Profile, User } from '@work/types';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { PostCard } from '@/components/feed/PostCard';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatRelative } from '@/lib/utils';

type Tab = 'posts' | 'about' | 'experience' | 'education' | 'portfolio' | 'cv';

const TABS: { id: Tab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'cv', label: 'CV' }
];

export default function ProfilePage() {
  const { handle } = useParams();
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('posts');

  const { data: user, isLoading } = useQuery<User & { profile: Profile; counts: { followers: number; following: number } }>({
    queryKey: ['profile', handle],
    queryFn: async () => (await api.get(`/users/${handle}`)).data.data
  });

  const { data: follow } = useQuery<{ following: boolean }>({
    queryKey: ['is-following', user?.id],
    enabled: !!user?.id && user?.id !== me?.id,
    queryFn: async () => (await api.get(`/users/${user!.id}/is-following`)).data.data
  });

  const { data: posts } = useQuery<Post[]>({
    queryKey: ['posts', handle],
    enabled: tab === 'posts',
    queryFn: async () => (await api.get(`/posts/user/${handle}`)).data.data
  });

  const followMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await api.request({ method: follow?.following ? 'DELETE' : 'POST', url: `/users/follow/${user.id}` });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-following', user?.id] });
      qc.invalidateQueries({ queryKey: ['profile', handle] });
    }
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!user) return <p className="text-muted">Not found.</p>;

  const isMe = me?.id === user.id;
  const profile = user.profile ?? {};

  return (
    <div className="space-y-4">
      {/* Cover + identity */}
      <Card variant="surface" size="sm" className="overflow-hidden !p-0">
        <div className="relative h-44 sm:h-56">
          {profile.cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-grad-aurora animate-aurora" />}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg-elev to-transparent" />
        </div>
        <div className="relative px-5 sm:px-6 pb-5">
          <div className="-mt-12 sm:-mt-14 flex items-end justify-between">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="rounded-full ring-4 ring-bg">
                <Avatar src={user.avatar} name={user.name} size="xl" />
              </div>
            </motion.div>
            <div className="flex gap-2 mt-2">
              {!isMe && (
                <>
                  <Button size="sm" variant="glass"><MessageSquare size={14} /> Message</Button>
                  <Button
                    size="sm" variant={follow?.following ? 'glass' : 'accent'} magnetic
                    onClick={() => followMut.mutate()}
                  >
                    {follow?.following ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                  </Button>
                </>
              )}
              {isMe && <Button size="sm" variant="glass">Edit profile</Button>}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="font-display text-2xl tracking-tighter flex items-center gap-1.5">
              {user.name}
              {user.emailVerified && <CheckCircle2 size={16} className="text-accent" />}
            </h1>
            <p className="text-sm text-muted">
              @{user.handle} · {user.headline ?? 'Member at WORK'}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              {user.location && <span className="flex items-center gap-1"><MapPin size={12} /> {user.location}</span>}
              {(user as any).companyName && <span className="flex items-center gap-1"><Briefcase size={12} /> {(user as any).companyName}</span>}
              {(user as any).universityName && <span className="flex items-center gap-1"><GraduationCap size={12} /> {(user as any).universityName}</span>}
              <span>Joined {formatRelative(user.createdAt)}</span>
            </div>

            <div className="mt-3 flex gap-4 text-sm">
              <span><b className="text-fg">{user.counts.following.toLocaleString()}</b> <span className="text-muted">following</span></span>
              <span><b className="text-fg">{user.counts.followers.toLocaleString()}</b> <span className="text-muted">followers</span></span>
            </div>

            {profile.openToWork && <Badge variant="success" dot className="mt-3">Open to work</Badge>}
            {profile.hiring && <Badge variant="accent" dot className="mt-3 ml-2">Hiring</Badge>}

            {user.bio && <p className="mt-4 text-sm text-fg-soft max-w-2xl">{user.bio}</p>}

            {user.skills && user.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {user.skills.map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative px-4 py-2.5 text-sm whitespace-nowrap transition',
                active ? 'text-fg' : 'text-muted hover:text-fg'
              )}
            >
              {t.label}
              {active && (
                <motion.span layoutId="profile-tab" className="absolute inset-x-2 -bottom-px h-0.5 bg-fg" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'posts' && (
          <div className="space-y-3">
            {posts?.length === 0 && <Empty icon={FileText} text="No posts yet." />}
            {posts?.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
        {tab === 'about' && (
          <Card variant="glass">
            <h3 className="font-display text-lg mb-3">About</h3>
            <p className="text-sm text-fg-soft whitespace-pre-wrap">{user.bio || 'Nothing here yet.'}</p>
            {profile.socials && Object.values(profile.socials).some(Boolean) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(profile.socials).map(([k, v]) => v ? (
                  <a key={k} href={v} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    <LinkIcon size={12} /> {k}
                  </a>
                ) : null)}
              </div>
            )}
          </Card>
        )}

        {tab === 'experience' && (
          <Card variant="glass">
            {(!profile.experience || !profile.experience.length) ? <Empty icon={Briefcase} text="No experience added." /> : (
              <ul className="space-y-5">
                {profile.experience.map((e, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="size-10 rounded-xl bg-grad-accent grid place-items-center shrink-0">
                      <Briefcase size={16} className="text-accent-fg" />
                    </div>
                    <div>
                      <p className="font-medium">{e.role} <span className="text-muted">· {e.company}</span></p>
                      <p className="text-xs text-muted">
                        {fmt(e.start)} – {e.current ? 'Present' : fmt(e.end)}
                        {e.location && ` · ${e.location}`}
                      </p>
                      {e.description && <p className="mt-1 text-sm text-fg-soft">{e.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'education' && (
          <Card variant="glass">
            {(!profile.education || !profile.education.length) ? <Empty icon={GraduationCap} text="No education added." /> : (
              <ul className="space-y-5">
                {profile.education.map((e, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="size-10 rounded-xl bg-grad-accent grid place-items-center shrink-0">
                      <GraduationCap size={16} className="text-accent-fg" />
                    </div>
                    <div>
                      <p className="font-medium">{e.school}</p>
                      <p className="text-xs text-muted">{[e.degree, e.field].filter(Boolean).join(' · ')}</p>
                      <p className="text-xs text-muted">{fmt(e.start)} – {fmt(e.end)}</p>
                      {e.description && <p className="mt-1 text-sm text-fg-soft">{e.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'portfolio' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {(!profile.portfolio || !profile.portfolio.length) && (
              <Card variant="glass" className="sm:col-span-2"><Empty icon={ImageIcon} text="No portfolio items." /></Card>
            )}
            {profile.portfolio?.map((p, i) => (
              <Card key={i} variant="glass" interactive tilt glow>
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="w-full h-40 object-cover rounded-xl mb-3" />
                )}
                <p className="font-medium">{p.title}</p>
                {p.description && <p className="text-sm text-muted mt-1">{p.description}</p>}
                {p.url && <a href={p.url} target="_blank" rel="noopener" className="text-xs text-accent inline-flex items-center gap-1 mt-2"><LinkIcon size={12} /> Visit</a>}
              </Card>
            ))}
          </div>
        )}

        {tab === 'cv' && (
          <Card variant="glass">
            <Empty icon={FileText} text="No CV uploaded yet." />
          </Card>
        )}
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="text-center py-10 text-muted">
      <Icon size={28} />
      <p className="mt-2 text-sm">{text}</p>
    </div>
  );
}

function fmt(d?: string) { return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'; }

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-3 w-72" />
    </div>
  );
}
