'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, DollarSign, Star, Plus, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Stars } from '@/components/freelance/Stars';
import { formatRelative } from '@/lib/utils';

interface Analytics {
  gigCount: number; publishedCount: number;
  views: number; orders: number; revenue: number;
  ordersByStatus: Record<string, number>;
  rating: { avg: number; count: number };
}

interface MyGig {
  _id: string; slug: string; title: string; status: string;
  cover?: string; priceFrom: number;
  rating: { avg: number; count: number };
  stats: { views: number; orders: number; activeOrders: number };
}

interface Order {
  _id: string; status: string; price: number; tier: string; createdAt: string;
  buyerId: string; gig?: { title: string; cover?: string; slug: string };
}

export default function SellerDashboardPage() {
  const analytics = useQuery<Analytics>({
    queryKey: ['freelance', 'analytics'],
    queryFn: async () => (await api.get('/freelance/analytics')).data.data
  });
  const gigs = useQuery<MyGig[]>({
    queryKey: ['freelance', 'gigs', 'mine'],
    queryFn: async () => (await api.get('/freelance/gigs/mine')).data.data
  });
  const orders = useQuery<Order[]>({
    queryKey: ['freelance', 'orders', 'seller'],
    queryFn: async () => (await api.get('/freelance/orders', { params: { role: 'seller' } })).data.data
  });

  if (analytics.isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const a = analytics.data!;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tightest">Seller dashboard</h1>
          <p className="text-sm text-muted mt-1">Your services, orders, revenue.</p>
        </div>
        <Link href="/freelance/new">
          <Button variant="accent" magnetic><Plus size={14} /> New service</Button>
        </Link>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={DollarSign} label="Revenue" value={`$${(a.revenue ?? 0).toLocaleString()}`} tone="oklch(78% 0.22 142)" />
        <Stat icon={ShoppingBag} label="Orders" value={String(a.orders)} tone="oklch(78% 0.18 200)" />
        <Stat icon={Eye} label="Views" value={a.views.toLocaleString()} tone="oklch(72% 0.2 264)" />
        <Stat icon={Star} label="Avg rating" value={a.rating.avg ? a.rating.avg.toFixed(1) : '—'} tone="oklch(75% 0.22 50)" />
      </div>

      {/* Funnel */}
      {a.orders > 0 && (
        <Card variant="glass">
          <p className="text-eyebrow mb-3">Orders funnel</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['pending', 'in_progress', 'delivered', 'completed', 'cancelled'].map((s, i) => {
              const c = a.ordersByStatus[s] ?? 0;
              return (
                <motion.div key={s}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border p-3 text-center">
                  <p className="font-display text-xl tracking-tighter tabular-nums">{c}</p>
                  <p className="text-2xs uppercase tracking-caps text-muted">{s.replace('_', ' ')}</p>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Gigs */}
      <section>
        <header className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl tracking-tighter">Your services</h2>
          <span className="text-eyebrow">{a.publishedCount} published · {a.gigCount} total</span>
        </header>
        <div className="grid sm:grid-cols-2 gap-3">
          {gigs.data?.length === 0 && (
            <Card variant="glass" className="sm:col-span-2 text-center py-12">
              <p className="font-medium">No services yet.</p>
              <Link href="/freelance/new" className="text-sm text-accent hover:underline">Create your first service →</Link>
            </Card>
          )}
          {gigs.data?.map((g) => (
            <Link key={g._id} href={`/freelance/gig/${g.slug}`}>
              <Card variant="glass" className="flex gap-3 items-center hover-lift">
                <div className="size-16 rounded-xl overflow-hidden border border-border shrink-0">
                  {g.cover
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={g.cover} alt="" className="size-full object-cover" />
                    : <div className="size-full bg-grad-aurora" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{g.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-2xs text-muted">
                    <Badge variant="soft" className="capitalize">{g.status}</Badge>
                    <span><Stars value={g.rating.avg} size={10} /> {g.rating.avg ? g.rating.avg.toFixed(1) : '—'}</span>
                    <span>· {g.stats.views} views</span>
                  </div>
                  <p className="mt-1 text-xs">From <span className="font-medium tabular-nums">${g.priceFrom}</span></p>
                </div>
                <ExternalLink size={14} className="text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <header className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl tracking-tighter">Recent orders</h2>
          <Link href="/freelance/orders" className="text-eyebrow hover:text-fg">View all</Link>
        </header>
        <div className="space-y-2">
          {orders.data?.length === 0 && (
            <Card variant="glass" className="text-center py-8">
              <p className="text-sm text-muted">No orders yet.</p>
            </Card>
          )}
          {orders.data?.slice(0, 8).map((o) => (
            <Card key={o._id} variant="glass" className="flex items-center gap-3">
              <div className="size-10 rounded-lg overflow-hidden border border-border shrink-0">
                {o.gig?.cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={o.gig.cover} alt="" className="size-full object-cover" />
                  : <div className="size-full bg-grad-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{o.gig?.title ?? 'Order'}</p>
                <p className="text-2xs text-muted capitalize">
                  {o.tier} · {formatRelative(o.createdAt)}
                </p>
              </div>
              <Badge variant={
                o.status === 'completed' ? 'success' :
                o.status === 'cancelled' ? 'soft' :
                'accent'
              } className="capitalize">{o.status.replace('_', ' ')}</Badge>
              <span className="text-sm font-medium tabular-nums">${o.price}</span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }:
  { icon: React.ComponentType<{ size?: number }>; label: string; value: string; tone: string }) {
  return (
    <Card variant="glass" className="flex items-center gap-3">
      <div className="size-10 rounded-xl grid place-items-center shadow-glow"
        style={{ background: `linear-gradient(135deg, ${tone}, var(--accent))` }}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-2xs uppercase tracking-caps text-muted">{label}</p>
        <p className="font-display text-xl tracking-tighter tabular-nums" style={{ color: tone }}>{value}</p>
      </div>
    </Card>
  );
}
