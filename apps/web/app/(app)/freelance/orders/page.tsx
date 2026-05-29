'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShoppingBag, MessageCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Stars } from '@/components/freelance/Stars';
import { cn, formatRelative } from '@/lib/utils';

interface Order {
  _id: string; status: string; price: number; tier: string; createdAt: string;
  chatRoomId?: string;
  gig?: { title: string; cover?: string; slug: string };
}

export default function MyOrdersPage() {
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', role],
    queryFn: async () => (await api.get('/freelance/orders', { params: { role } })).data.data
  });

  const [reviewFor, setReviewFor] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const complete = useMutation({
    mutationFn: async (id: string) => api.post(`/freelance/orders/${id}/complete`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order completed'); }
  });

  async function submitReview() {
    if (!reviewFor) return;
    setSubmitting(true);
    try {
      await api.post(`/freelance/orders/${reviewFor._id}/review`, { rating, comment });
      toast.success('Review submitted');
      setReviewFor(null); setComment(''); setRating(5);
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tightest">Orders</h1>
          <p className="text-sm text-muted mt-1">Track everything you bought or sold.</p>
        </div>
        <div className="flex gap-1.5">
          {(['buyer', 'seller'] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={cn(
                'rounded-pill px-3 py-1 text-xs border capitalize transition',
                role === r ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface hover:border-border-strong'
              )}>
              As {r}
            </button>
          ))}
        </div>
      </header>

      {isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
      {!isLoading && orders.length === 0 && (
        <Card variant="glass" className="text-center py-16">
          <ShoppingBag size={26} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">No orders yet.</p>
          <Link href="/freelance" className="text-sm text-accent hover:underline">Browse the marketplace →</Link>
        </Card>
      )}

      <div className="space-y-3">
        {orders.map((o, i) => (
          <motion.div key={o._id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}>
            <Card variant="glass" className="flex items-center gap-3 flex-wrap">
              <div className="size-12 rounded-xl overflow-hidden border border-border shrink-0">
                {o.gig?.cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={o.gig.cover} alt="" className="size-full object-cover" />
                  : <div className="size-full bg-grad-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/freelance/gig/${o.gig?.slug}`} className="text-sm font-medium hover:underline truncate block">
                  {o.gig?.title}
                </Link>
                <p className="text-2xs text-muted capitalize">{o.tier} · {formatRelative(o.createdAt)}</p>
              </div>
              <Badge variant={
                o.status === 'completed' ? 'success' :
                o.status === 'cancelled' ? 'soft' :
                'accent'
              } className="capitalize">{o.status.replace('_', ' ')}</Badge>
              <span className="text-sm font-medium tabular-nums">${o.price}</span>

              {o.chatRoomId && (
                <Link href="/messages">
                  <Button size="sm" variant="glass"><MessageCircle size={13} /> Chat</Button>
                </Link>
              )}
              {role === 'buyer' && o.status === 'delivered' && (
                <Button size="sm" variant="accent" onClick={() => complete.mutate(o._id)}>
                  <CheckCircle2 size={13} /> Complete
                </Button>
              )}
              {role === 'buyer' && o.status === 'completed' && (
                <Button size="sm" variant="glass" onClick={() => setReviewFor(o)}>
                  Leave review
                </Button>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={!!reviewFor} onOpenChange={(v) => !v && setReviewFor(null)}
        title="Leave a review" size="md"
        description={reviewFor?.gig?.title}
      >
        <div className="space-y-4">
          <div>
            <p className="text-eyebrow mb-2">Rating</p>
            <Stars value={rating} size={28} interactive onChange={setRating} />
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Tell other buyers how it went…" className="min-h-32" />
          <Button variant="accent" magnetic className="w-full" loading={submitting} onClick={submitReview}>
            Submit review
          </Button>
        </div>
      </Modal>
    </div>
  );
}
