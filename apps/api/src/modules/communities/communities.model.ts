import { Schema, model } from 'mongoose';

export const CHANNEL_TYPES = ['text', 'announcement', 'resource', 'event'] as const;
export type ChannelType = typeof CHANNEL_TYPES[number];

export const COMMUNITY_ROLES = ['owner', 'admin', 'moderator', 'member'] as const;
export type CommunityRole = typeof COMMUNITY_ROLES[number];

const ChannelSubSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  type: { type: String, enum: CHANNEL_TYPES, default: 'text' },
  topic: String,
  position: { type: Number, default: 0 },
  readOnlyFor: { type: [String], enum: COMMUNITY_ROLES, default: [] }, // e.g. ['member'] for announcements
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const CommunitySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 600 },
    icon: String,
    banner: String,
    accent: String,
    rules: [{ title: String, body: String }],
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    membersCount: { type: Number, default: 1 },
    channels: [ChannelSubSchema],
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    tags: [String]
  },
  { timestamps: true }
);
CommunitySchema.index({ name: 'text', description: 'text', tags: 'text' });

const MembershipSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: COMMUNITY_ROLES, default: 'member', index: true },
    mutedUntil: Date,
    bannedAt: Date,
    bannedReason: String,
    joinedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
MembershipSchema.index({ communityId: 1, userId: 1 }, { unique: true });

const ChannelMessageSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    channelId: { type: Schema.Types.ObjectId, required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
    attachments: [{ url: String, type: { type: String, enum: ['image', 'video', 'file'] }, name: String, size: Number, mime: String }],
    reactions: [{ emoji: String, userId: { type: Schema.Types.ObjectId, ref: 'User' } }],
    replyTo: { type: Schema.Types.ObjectId },
    pinned: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    deletedAt: Date
  },
  { timestamps: true }
);
ChannelMessageSchema.index({ channelId: 1, createdAt: -1 });

export const CommunityModel = model('Community', CommunitySchema);
export const MembershipModel = model('Membership', MembershipSchema);
export const ChannelMessageModel = model('ChannelMessage', ChannelMessageSchema);
