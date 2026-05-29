import { Schema, model } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'like', 'comment', 'follow', 'friend_request', 'friend_accepted',
  'message', 'chat_mention',
  'community_invited', 'community_announcement',
  'job_match', 'job_application', 'application_status',
  'event_new', 'event_reminder', 'event_announcement', 'event_cancelled',
  'order_new', 'order_delivered', 'order_completed',
  'review_new',
  'badge_unlocked', 'level_up',
  'system'
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

export const NOTIFICATION_CATEGORIES = ['social', 'messages', 'jobs', 'events', 'communities', 'system'] as const;
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[number];

const NotificationSchema = new Schema(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:     { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    category: { type: String, enum: NOTIFICATION_CATEGORIES, required: true, index: true },

    actorId:  { type: Schema.Types.ObjectId, ref: 'User' },
    actorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    title:    String,
    body:     String,

    target: {
      kind: { type: String },
      id:   Schema.Types.ObjectId,
      slug: String
    },

    groupKey: { type: String, index: true },
    groupCount: { type: Number, default: 1 },
    lastAt:   { type: Date, default: Date.now },

    href:     String,
    read:     { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, groupKey: 1, type: 1 }, { sparse: true });

export const NotificationModel = model('Notification', NotificationSchema);

/* User preferences (per-type push toggles + global mute) */
const PrefSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    push:  { type: Map, of: Boolean, default: {} },
    email: { type: Map, of: Boolean, default: {} },
    mutedUntil: Date
  },
  { timestamps: true }
);
export const NotificationPrefsModel = model('NotificationPrefs', PrefSchema);
