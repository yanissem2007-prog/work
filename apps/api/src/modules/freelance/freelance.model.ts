import { Schema, model } from 'mongoose';

export const GIG_CATEGORIES = ['design', 'development', 'editing', 'writing', 'marketing'] as const;
export type GigCategory = typeof GIG_CATEGORIES[number];

export const ORDER_STATUSES = ['pending', 'in_progress', 'delivered', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

const PackageSchema = new Schema({
  tier: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  deliveryDays: { type: Number, default: 7 },
  revisions: { type: Number, default: 1 },
  features: [String]
}, { _id: false });

const GigSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    category: { type: String, enum: GIG_CATEGORIES, required: true, index: true },
    subcategory: String,
    description: { type: String, required: true, maxlength: 8000 },
    tags: [String],
    skills: [String],
    cover: String,
    gallery: [String],
    packages: { type: [PackageSchema], default: [] },
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    stats: {
      views: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      activeOrders: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['draft', 'published', 'paused'], default: 'draft', index: true },
    deliveryFastest: { type: Number, default: 7 }, // min deliveryDays
    priceFrom: { type: Number, default: 0 }        // min price across packages
  },
  { timestamps: true }
);
GigSchema.index({ title: 'text', description: 'text', tags: 'text', skills: 'text' });
GigSchema.index({ category: 1, status: 1, 'rating.avg': -1 });

const OrderSchema = new Schema(
  {
    gigId: { type: Schema.Types.ObjectId, ref: 'Gig', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tier: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    price: Number,
    currency: { type: String, default: 'USD' },
    deliveryDays: Number,
    revisions: Number,
    brief: String,
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    deliverables: [{ url: String, name: String, deliveredAt: Date }],
    chatRoomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    dueAt: Date,
    completedAt: Date
  },
  { timestamps: true }
);
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });

const ReviewSchema = new Schema(
  {
    gigId: { type: Schema.Types.ObjectId, ref: 'Gig', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 2000 },
    breakdown: {
      communication: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 }
    }
  },
  { timestamps: true }
);

export const GigModel = model('Gig', GigSchema);
export const OrderModel = model('Order', OrderSchema);
export const ReviewModel = model('Review', ReviewSchema);
