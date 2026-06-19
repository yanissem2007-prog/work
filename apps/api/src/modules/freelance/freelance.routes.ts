import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authRequired } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import { HttpError } from '../../middleware/error';
import {
  GigModel, OrderModel, ReviewModel, GIG_CATEGORIES, ORDER_STATUSES
} from './freelance.model';
import { UserModel } from '../auth/auth.model';
import { RoomModel } from '../chat/chat.model';
import { awardXp } from '../gamification/xp.service';
import { getIO } from '../../sockets/registry';

const { Types: { ObjectId } } = mongoose;
export const freelanceRouter = Router();

/* ─── Gig browsing ─── */

freelanceRouter.get('/gigs', asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { status: 'published' };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.skills) filter.skills = { $in: String(req.query.skills).split(',') };
  if (req.query.maxPrice) filter.priceFrom = { $lte: Number(req.query.maxPrice) };
  const sort =
    req.query.sort === 'rating' ? { 'rating.avg': -1 as const } :
    req.query.sort === 'price' ? { priceFrom: 1 as const } :
    req.query.sort === 'delivery' ? { deliveryFastest: 1 as const } :
    { 'rating.avg': -1 as const, 'stats.orders': -1 as const, createdAt: -1 as const };
  const limit = Math.min(40, Number(req.query.limit ?? 20));

  const gigs = await GigModel.find(filter).sort(sort as any).limit(limit).lean();
  const sellers = await UserModel.find({ _id: { $in: gigs.map((g) => g.sellerId) } })
    .select('handle name avatar headline').lean();
  const byId = new Map(sellers.map((s) => [String(s._id), s]));
  return ok(res, gigs.map((g) => ({ ...g, seller: byId.get(String(g.sellerId)) })));
}));

freelanceRouter.get('/gigs/mine', authRequired, asyncHandler(async (req, res) => {
  const gigs = await GigModel.find({ sellerId: req.user!.sub }).sort({ updatedAt: -1 }).lean();
  return ok(res, gigs);
}));

freelanceRouter.get('/gigs/:idOrSlug', asyncHandler(async (req, res) => {
  const id = req.params.idOrSlug;
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
  const gig = await GigModel.findOneAndUpdate(filter, { $inc: { 'stats.views': 1 } }, { new: true }).lean();
  if (!gig) throw new HttpError(404, 'NOT_FOUND', 'Gig');
  const seller = await UserModel.findById(gig.sellerId)
    .select('handle name avatar headline createdAt skills').lean();
  const reviews = await ReviewModel.find({ gigId: gig._id }).sort({ createdAt: -1 }).limit(20).lean();
  const buyers = await UserModel.find({ _id: { $in: reviews.map((r) => r.buyerId) } })
    .select('handle name avatar').lean();
  const buyerById = new Map(buyers.map((u) => [String(u._id), u]));
  return ok(res, {
    ...gig,
    seller,
    reviews: reviews.map((r) => ({ ...r, buyer: buyerById.get(String(r.buyerId)) }))
  });
}));

/* ─── Create / edit ─── */

const PackageDto = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
  title: z.string().min(2).max(80),
  description: z.string().max(800).optional(),
  price: z.number().int().min(5).max(50_000),
  currency: z.string().length(3).default('USD'),
  deliveryDays: z.number().int().min(1).max(180),
  revisions: z.number().int().min(0).max(10).default(1),
  features: z.array(z.string()).max(15).optional()
});

const CreateGigDto = z.object({
  title: z.string().min(8).max(120),
  category: z.enum(GIG_CATEGORIES),
  subcategory: z.string().max(60).optional(),
  description: z.string().min(40).max(8000),
  tags: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(15).optional(),
  cover: z.string().url().optional(),
  gallery: z.array(z.string().url()).max(8).optional(),
  packages: z.array(PackageDto).min(1).max(3)
});

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

freelanceRouter.post('/gigs', authRequired, asyncHandler(async (req, res) => {
  const data = CreateGigDto.parse(req.body);
  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  let n = 1;
  while (await GigModel.exists({ slug })) slug = `${baseSlug}-${++n}`;
  const priceFrom = Math.min(...data.packages.map((p) => p.price));
  const deliveryFastest = Math.min(...data.packages.map((p) => p.deliveryDays));
  const gig = await GigModel.create({
    ...data, slug, sellerId: req.user!.sub,
    status: 'published', priceFrom, deliveryFastest
  });
  void awardXp(req.user!.sub, 'cv.create'); // reuse event slot — could add gig.create
  return created(res, gig);
}));

const PatchGigDto = CreateGigDto.partial().extend({
  status: z.enum(['draft', 'published', 'paused']).optional()
});

freelanceRouter.patch('/gigs/:id', authRequired, asyncHandler(async (req, res) => {
  const data = PatchGigDto.parse(req.body);
  const update: any = { ...data };
  if (data.packages) {
    update.priceFrom = Math.min(...data.packages.map((p) => p.price));
    update.deliveryFastest = Math.min(...data.packages.map((p) => p.deliveryDays));
  }
  const gig = await GigModel.findOneAndUpdate(
    { _id: req.params.id, sellerId: req.user!.sub },
    { $set: update },
    { new: true }
  );
  if (!gig) throw new HttpError(404, 'NOT_FOUND', 'Gig');
  return ok(res, gig);
}));

freelanceRouter.delete('/gigs/:id', authRequired, asyncHandler(async (req, res) => {
  await GigModel.deleteOne({ _id: req.params.id, sellerId: req.user!.sub });
  return ok(res, { ok: true });
}));

/* ─── Orders ─── */

const OrderDto = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
  brief: z.string().max(4000).optional()
});

freelanceRouter.post('/gigs/:id/order', authRequired, asyncHandler(async (req, res) => {
  const { tier, brief } = OrderDto.parse(req.body);
  const gig = await GigModel.findById(req.params.id);
  if (!gig || gig.status !== 'published') throw new HttpError(404, 'NOT_FOUND', 'Gig');
  if (String(gig.sellerId) === req.user!.sub) throw new HttpError(400, 'SELF', 'Cannot order your own gig');

  const pkg = gig.packages.find((p: any) => p.tier === tier);
  if (!pkg) throw new HttpError(400, 'INVALID_TIER', 'Tier not offered');

  // Auto-create a DM room scoped to the order
  const members = [new ObjectId(req.user!.sub), gig.sellerId].sort();
  let room = await RoomModel.findOne({ type: 'dm', members: { $all: members, $size: 2 } });
  if (!room) {
    room = await RoomModel.create({
      type: 'dm', members, createdBy: req.user!.sub, lastMessageAt: new Date()
    });
  }

  const order = await OrderModel.create({
    gigId: gig._id, sellerId: gig.sellerId, buyerId: req.user!.sub,
    tier, price: pkg.price, currency: pkg.currency,
    deliveryDays: pkg.deliveryDays, revisions: pkg.revisions,
    brief, status: 'in_progress',
    chatRoomId: room._id,
    dueAt: new Date(Date.now() + pkg.deliveryDays * 86_400_000)
  });

  await GigModel.updateOne({ _id: gig._id }, {
    $inc: { 'stats.orders': 1, 'stats.activeOrders': 1 }
  });

  getIO()?.to(`user:${gig.sellerId}`).emit('notif:push', {
    type: 'order', kind: 'new', orderId: String(order._id), gigId: String(gig._id)
  });
  return created(res, order);
}));

freelanceRouter.get('/orders', authRequired, asyncHandler(async (req, res) => {
  const role = req.query.role === 'seller' ? 'sellerId' : 'buyerId';
  const orders = await OrderModel.find({ [role]: req.user!.sub })
    .sort({ createdAt: -1 }).limit(60).lean();
  const gigIds = orders.map((o) => o.gigId);
  const gigs = await GigModel.find({ _id: { $in: gigIds } }).select('title cover slug').lean();
  const byId = new Map(gigs.map((g) => [String(g._id), g]));
  return ok(res, orders.map((o) => ({ ...o, gig: byId.get(String(o.gigId)) })));
}));

freelanceRouter.post('/orders/:id/deliver', authRequired, asyncHandler(async (req, res) => {
  const order = await OrderModel.findOne({ _id: req.params.id, sellerId: req.user!.sub });
  if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order');
  const deliverable = z.object({ url: z.string().url(), name: z.string().optional() })
    .parse(req.body);
  order.deliverables.push({ ...deliverable, deliveredAt: new Date() } as any);
  order.status = 'delivered';
  await order.save();
  getIO()?.to(`user:${order.buyerId}`).emit('notif:push', {
    type: 'order', kind: 'delivered', orderId: String(order._id)
  });
  return ok(res, order);
}));

freelanceRouter.post('/orders/:id/complete', authRequired, asyncHandler(async (req, res) => {
  const order = await OrderModel.findOne({ _id: req.params.id, buyerId: req.user!.sub });
  if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order');
  if (order.status !== 'delivered') throw new HttpError(400, 'NOT_DELIVERED', 'Mark only delivered orders complete');
  order.status = 'completed';
  order.completedAt = new Date();
  await order.save();
  await GigModel.updateOne({ _id: order.gigId }, { $inc: { 'stats.activeOrders': -1 } });
  return ok(res, order);
}));

freelanceRouter.post('/orders/:id/cancel', authRequired, asyncHandler(async (req, res) => {
  const order = await OrderModel.findOne({
    _id: req.params.id,
    $or: [{ buyerId: req.user!.sub }, { sellerId: req.user!.sub }]
  });
  if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order');
  if (['completed', 'cancelled'].includes(order.status)) throw new HttpError(400, 'INVALID', 'Cannot cancel');
  order.status = 'cancelled';
  await order.save();
  await GigModel.updateOne({ _id: order.gigId }, { $inc: { 'stats.activeOrders': -1 } });
  return ok(res, order);
}));

/* ─── Reviews ─── */

const ReviewDto = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  breakdown: z.object({
    communication: z.number().int().min(1).max(5),
    quality: z.number().int().min(1).max(5),
    value: z.number().int().min(1).max(5)
  }).optional()
});

freelanceRouter.post('/orders/:id/review', authRequired, asyncHandler(async (req, res) => {
  const order = await OrderModel.findOne({ _id: req.params.id, buyerId: req.user!.sub, status: 'completed' });
  if (!order) throw new HttpError(400, 'NOT_REVIEWABLE', 'Only completed orders can be reviewed');
  const data = ReviewDto.parse(req.body);
  const exists = await ReviewModel.exists({ orderId: order._id });
  if (exists) throw new HttpError(409, 'CONFLICT', 'Already reviewed');

  const review = await ReviewModel.create({
    gigId: order.gigId, orderId: order._id,
    sellerId: order.sellerId, buyerId: req.user!.sub,
    ...data
  });

  // Recompute rating average
  const agg = await ReviewModel.aggregate([
    { $match: { gigId: order.gigId } },
    { $group: { _id: '$gigId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const stats = agg[0] ?? { avg: 0, count: 0 };
  await GigModel.updateOne({ _id: order.gigId }, {
    $set: { 'rating.avg': Math.round(stats.avg * 10) / 10, 'rating.count': stats.count }
  });

  return created(res, review);
}));

/* ─── Seller analytics ─── */

freelanceRouter.get('/analytics', authRequired, asyncHandler(async (req, res) => {
  const sellerId = new ObjectId(req.user!.sub);
  const [gigs, orderAgg, reviewAgg] = await Promise.all([
    GigModel.find({ sellerId }).lean(),
    OrderModel.aggregate([
      { $match: { sellerId } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$price' } } }
    ]),
    ReviewModel.aggregate([
      { $match: { sellerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])
  ]);
  const totalViews = gigs.reduce((s, g) => s + (g.stats?.views ?? 0), 0);
  const totalOrders = gigs.reduce((s, g) => s + (g.stats?.orders ?? 0), 0);
  const completed = orderAgg.find((x) => x._id === 'completed');
  return ok(res, {
    gigCount: gigs.length,
    publishedCount: gigs.filter((g) => g.status === 'published').length,
    views: totalViews,
    orders: totalOrders,
    revenue: completed?.revenue ?? 0,
    ordersByStatus: orderAgg.reduce((acc: Record<string, number>, x) => ({ ...acc, [x._id]: x.count }), {}),
    rating: reviewAgg[0] ? { avg: Math.round(reviewAgg[0].avg * 10) / 10, count: reviewAgg[0].count } : { avg: 0, count: 0 }
  });
}));
