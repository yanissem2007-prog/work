'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, MapPin, Globe, Users2, Calendar, CheckCircle2, Star, MessageSquarePlus,
  ThumbsUp, Sparkles, Briefcase
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Stars } from '@/components/freelance/Stars';
import { RatingDistribution } from '@/components/reviews/RatingDistribution';
import { BreakdownBars } from '@/components/reviews/BreakdownBars';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { fmtSalary } from '@/components/jobs/JobCard';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { cn } from '@/lib/utils';

interface Company {
  _id: string; slug: string; name: string; description?: string;
  logo?: string; banner?: string; website?: string;
  industry?: string; size?: string; location?: string; foundedYear?: number;
  followersCount?: number; jobsCount?: number; verified?: boolean;
  jobs?: any[];
}

interface Analytics {
  count: number; avg: number;
  breakdown: { culture: number; comp: number; worklife: number; management: number; growth: number };
  recommendPct: number;
  distribution: Record<number, number>;
}

interface Review {
  _id: string; rating: number; title: string; pros?: string; cons?: string; advice?: string;
  recommend: boolean; anonymous: boolean; createdAt: string; helpfulCount: number;
  employmentStatus: string; role?: string; tenureYears?: number; location?: string;
  breakdown: any;
  author?: any;
}

type Tab = 'overview' | 'jobs' | 'reviews';

export default function CompanyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>('overview');

  const company = useQuery<Company>({
    queryKey: ['company', slug],
    queryFn: async () => (await api.get(`/companies/${slug}`)).data.data
  });

  const analytics = useQuery<Analytics>({
    queryKey: ['company-reviews-analytics', slug],
    queryFn: async () => (await api.get(`/companies/${slug}/reviews/analytics`)).data.data
  });

  const reviews = useQuery<Review[]>({
    queryKey: ['company-reviews', slug],
    queryFn: async () => (await api.get(`/companies/${slug}/reviews`)).data.data
  });

  const qc = useQueryClient();
  const follow = useMutation({
    mutationFn: async () => api.post(`/companies/${slug}/follow`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', slug] })
  });

  if (company.isLoading || !company.data) return <div className="grid place-items-center py-20"><Spinner /></div>;
  const c = company.data;
  const a = analytics.data;

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> Back
      </Link>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden glass-strong"
      >
        <div className="relative h-32 sm:h-44 overflow-hidden">
          {c.banner
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={c.banner} alt="" className="size-full object-cover" />
            : <div className="size-full bg-grad-aurora animate-aurora" />}
        </div>
        <div className="relative px-6 sm:px-8 pb-6">
          <div className="-mt-10 flex items-end justify-between flex-wrap gap-3">
            <div className="size-20 rounded-2xl border-4 border-bg-elev bg-bg overflow-hidden grid place-items-center">
              {c.logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={c.logo} alt={c.name} className="size-full object-cover" />
                : <Building2 size={28} className="text-muted" />}
            </div>
            <div className="flex gap-2">
              <Button variant="glass" size="sm" onClick={() => follow.mutate()}>Follow</Button>
              <Link href={`/companies/${slug}/review`}>
                <Button variant="accent" size="sm" magnetic>
                  <MessageSquarePlus size={13} /> Write a review
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-3xl tracking-tighter flex items-center gap-2">
              {c.name}
              {c.verified && <CheckCircle2 size={16} className="text-accent" />}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              {c.industry && <span>{c.industry}</span>}
              {c.size && <span className="flex items-center gap-1"><Users2 size={11} /> {c.size} employees</span>}
              {c.location && <span className="flex items-center gap-1"><MapPin size={11} /> {c.location}</span>}
              {c.foundedYear && <span className="flex items-center gap-1"><Calendar size={11} /> Founded {c.foundedYear}</span>}
              {c.website && <a href={c.website} target="_blank" rel="noopener" className="text-accent hover:underline inline-flex items-center gap-1">
                <Globe size={11} /> Website
              </a>}
            </div>

            {/* At-a-glance ratings */}
            {a && a.count > 0 && (
              <div className="mt-4 inline-flex items-center gap-4 rounded-2xl border border-border bg-bg-elev/60 px-4 py-2.5">
                <div>
                  <p className="font-display text-2xl tracking-tighter tabular-nums">{a.avg.toFixed(1)}</p>
                  <Stars value={Math.round(a.avg)} size={11} />
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="font-display text-2xl tracking-tighter tabular-nums">{a.recommendPct}%</p>
                  <p className="text-2xs text-muted">recommend</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="font-display text-2xl tracking-tighter tabular-nums">{a.count}</p>
                  <p className="text-2xs text-muted">reviews</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'jobs', label: `Jobs ${c.jobs?.length ? `(${c.jobs.length})` : ''}` },
          { id: 'reviews', label: `Reviews ${a?.count ? `(${a.count})` : ''}` }
        ] as { id: Tab; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'relative px-4 py-2.5 text-sm transition',
                active ? 'text-fg' : 'text-muted hover:text-fg'
              )}>
              {t.label}
              {active && <motion.span layoutId="company-tab" className="absolute inset-x-2 -bottom-px h-0.5 bg-fg" />}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <Card variant="glass">
            <h2 className="font-display text-xl tracking-tighter mb-3">About</h2>
            <p className="text-sm text-fg-soft whitespace-pre-wrap leading-relaxed">{c.description ?? 'No description yet.'}</p>
          </Card>
          {a && a.count > 0 && (
            <aside className="space-y-3">
              <Card variant="glass">
                <p className="text-eyebrow mb-3">Rating distribution</p>
                <RatingDistribution distribution={a.distribution} count={a.count} />
              </Card>
              <Card variant="glass">
                <p className="text-eyebrow mb-3">Breakdown</p>
                <BreakdownBars breakdown={a.breakdown} />
              </Card>
            </aside>
          )}
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-3">
          {(c.jobs ?? []).length === 0 && (
            <Card variant="glass" className="text-center py-12">
              <Briefcase size={26} className="mx-auto text-muted" />
              <p className="mt-3 text-muted">No open roles right now.</p>
            </Card>
          )}
          {c.jobs?.map((j: any) => (
            <Link key={j._id} href={`/jobs/${j._id}`}>
              <Card variant="glass" interactive className="flex items-center gap-3 hover-lift">
                <Briefcase size={14} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{j.title}</p>
                  <p className="text-2xs text-muted">{j.location ?? (j.remote ? 'Remote' : '—')} · {j.type}</p>
                </div>
                {(j.salaryMin || j.salaryMax) && (
                  <Badge variant="soft">{fmtSalary(j.salaryMin, j.salaryMax, j.currency)}</Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <ReviewsTab slug={slug} reviews={reviews.data ?? []} analytics={a} />
      )}
    </div>
  );
}

function ReviewsTab({ slug, reviews, analytics }: { slug: string; reviews: Review[]; analytics?: Analytics }) {
  const avgDisplay = useAnimatedCounter(Math.round((analytics?.avg ?? 0) * 10), 1.4);
  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <aside className="space-y-3 lg:sticky lg:top-4 h-fit">
        <Card variant="glass" className="text-center">
          <p className="text-eyebrow">Overall</p>
          <p className="mt-2 font-display text-6xl tracking-tightest tabular-nums">
            {(avgDisplay / 10).toFixed(1)}
          </p>
          <div className="mt-1 flex justify-center"><Stars value={Math.round((analytics?.avg ?? 0))} size={14} /></div>
          <p className="text-2xs text-muted mt-1">{analytics?.count ?? 0} reviews</p>
          {analytics && analytics.count > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-success/10 text-success text-xs">
              <ThumbsUp size={11} /> {analytics.recommendPct}% recommend
            </div>
          )}
        </Card>

        {analytics && analytics.count > 0 && (
          <>
            <Card variant="glass">
              <p className="text-eyebrow mb-3">Stars</p>
              <RatingDistribution distribution={analytics.distribution} count={analytics.count} />
            </Card>

            <Card variant="glass">
              <p className="text-eyebrow mb-3">Breakdown</p>
              <BreakdownBars breakdown={analytics.breakdown} />
            </Card>
          </>
        )}

        <Link href={`/companies/${slug}/review`}>
          <Button variant="accent" magnetic className="w-full">
            <Sparkles size={13} /> Write a review
          </Button>
        </Link>
      </aside>

      <div className="space-y-3">
        {reviews.length === 0 && (
          <Card variant="glass" className="text-center py-16">
            <Star size={26} className="mx-auto text-muted" />
            <p className="mt-3 font-medium">Be the first to share your experience.</p>
            <Link href={`/companies/${slug}/review`} className="text-sm text-accent hover:underline">Write a review →</Link>
          </Card>
        )}
        {reviews.map((r) => <ReviewCard key={r._id} review={r} slug={slug} />)}
      </div>
    </div>
  );
}
