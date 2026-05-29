'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, Sparkles, Eye, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Textarea } from '@/components/ui/Input';
import { PackageCard } from '@/components/freelance/PackageCard';
import { Stars } from '@/components/freelance/Stars';
import { useAuthStore } from '@/stores/authStore';
import { formatRelative } from '@/lib/utils';

interface Pkg { tier: 'basic'|'standard'|'premium'; title: string; description?: string; price: number; currency?: string; deliveryDays: number; revisions: number; features?: string[] }

interface Gig {
  _id: string; slug: string; title: string; description: string;
  category: string; cover?: string; gallery?: string[]; tags?: string[]; skills?: string[];
  packages: Pkg[];
  rating: { avg: number; count: number };
  stats: { views: number; orders: number };
  createdAt: string;
  seller: { handle: string; name: string; avatar?: string; headline?: string; createdAt: string; skills?: string[] };
  reviews: { _id: string; rating: number; comment?: string; createdAt: string; buyer?: { name?: string; avatar?: string; handle?: string } }[];
}

export default function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const [selectedTier, setSelectedTier] = useState<Pkg['tier']>('standard');
  const [orderOpen, setOrderOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: gig, isLoading } = useQuery<Gig>({
    queryKey: ['gig', id],
    queryFn: async () => (await api.get(`/freelance/gigs/${id}`)).data.data
  });

  async function placeOrder() {
    if (!gig) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/freelance/gigs/${gig._id}/order`, { tier: selectedTier, brief });
      toast.success('Order placed — chat opened with the seller');
      router.push(`/messages?room=${r.data.data.chatRoomId}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setSubmitting(false); }
  }

  if (isLoading || !gig) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const isOwn = me?.handle === gig.seller.handle;
  const selectedPkg = gig.packages.find((p) => p.tier === selectedTier) ?? gig.packages[0];

  return (
    <div className="space-y-8">
      <Link href="/freelance" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
        <ArrowLeft size={12} /> Back to marketplace
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-[1.4fr_1fr] gap-6"
      >
        <div>
          <div className="rounded-2xl overflow-hidden border border-border aspect-video">
            {gig.cover
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={gig.cover} alt={gig.title} className="size-full object-cover" />
              : <div className="size-full bg-grad-aurora animate-aurora" />}
          </div>
          {gig.gallery && gig.gallery.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gig.gallery.slice(0, 4).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="aspect-video w-full object-cover rounded-lg border border-border" />
              ))}
            </div>
          )}

          <Badge variant="soft" className="capitalize mt-5">{gig.category}</Badge>
          <h1 className="mt-3 font-display text-3xl md:text-4xl tracking-tightest leading-tight">
            {gig.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 flex-wrap text-sm">
            <Link href={`/profile/${gig.seller.handle}`} className="flex items-center gap-2 hover:underline">
              <Avatar src={gig.seller.avatar} name={gig.seller.name} ring />
              <div>
                <p className="font-medium">{gig.seller.name}</p>
                <p className="text-2xs text-muted">{gig.seller.headline ?? `@${gig.seller.handle}`}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 ml-auto text-xs text-muted">
              <span className="flex items-center gap-1"><Stars value={gig.rating.avg} size={13} /> {gig.rating.avg.toFixed(1)} ({gig.rating.count})</span>
              <span className="flex items-center gap-1"><Eye size={12} /> {gig.stats.views}</span>
              <span className="flex items-center gap-1"><ShoppingBag size={12} /> {gig.stats.orders}</span>
            </div>
          </div>

          <Card variant="glass" className="mt-6">
            <h2 className="font-display text-xl tracking-tighter mb-2">About this service</h2>
            <p className="text-sm text-fg-soft whitespace-pre-wrap leading-relaxed">{gig.description}</p>
            {gig.skills && gig.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {gig.skills.map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
              </div>
            )}
          </Card>

          {/* Reviews */}
          <section className="mt-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-xl tracking-tighter">Reviews</h2>
              <span className="text-eyebrow">{gig.rating.count} total</span>
            </div>
            <div className="space-y-3">
              {gig.reviews.length === 0 && (
                <Card variant="glass" className="text-center py-8">
                  <p className="text-sm text-muted">No reviews yet — be the first.</p>
                </Card>
              )}
              {gig.reviews.map((r, i) => (
                <motion.div key={r._id}
                  initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Card variant="glass">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.buyer?.avatar} name={r.buyer?.name ?? '—'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.buyer?.name}</p>
                        <div className="flex items-center gap-2">
                          <Stars value={r.rating} size={11} />
                          <span className="text-2xs text-muted">{formatRelative(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {r.comment && <p className="mt-3 text-sm text-fg-soft">{r.comment}</p>}
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Packages sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-4 h-fit">
          {gig.packages.map((p) => (
            <PackageCard
              key={p.tier}
              pkg={p}
              selected={selectedTier === p.tier}
              onSelect={() => setSelectedTier(p.tier)}
              onBuy={() => { setSelectedTier(p.tier); if (!isOwn) setOrderOpen(true); else toast.info('Sellers cannot order their own gig.'); }}
              busy={submitting}
            />
          ))}
          {!isOwn && (
            <Card variant="glass" className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Need clarifications first?</p>
                <p className="text-sm font-medium">Message the seller</p>
              </div>
              <Button size="sm" variant="glass"><MessageCircle size={13} /> Contact</Button>
            </Card>
          )}
        </aside>
      </motion.div>

      {/* Order drawer */}
      <Sheet open={orderOpen} onOpenChange={setOrderOpen} title="Place your order" side="right" size="md">
        <div className="space-y-4 px-1">
          <Card variant="glass">
            <p className="text-eyebrow mb-2">Package</p>
            <p className="font-medium">{selectedPkg.title}</p>
            <p className="text-2xs text-muted">{selectedPkg.deliveryDays} day delivery · {selectedPkg.revisions} revisions</p>
            <p className="mt-2 font-display text-2xl tracking-tightest tabular-nums">
              ${selectedPkg.price} {selectedPkg.currency ?? 'USD'}
            </p>
          </Card>

          <div>
            <p className="text-eyebrow mb-2 flex items-center gap-1.5">
              <Sparkles size={11} className="text-accent" /> Brief (optional)
            </p>
            <Textarea
              value={brief} onChange={(e) => setBrief(e.target.value)}
              placeholder="Share your project goals, references, deadlines…"
              className="min-h-40"
            />
          </div>

          <Button variant="accent" size="lg" magnetic loading={submitting}
            onClick={placeOrder} className="w-full">
            Confirm order
          </Button>
          <p className="text-2xs text-muted text-center">
            A chat room with the seller opens automatically.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
