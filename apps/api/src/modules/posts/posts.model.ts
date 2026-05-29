import { Schema, model } from 'mongoose';

const PostSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 4000 },
    media: [{ url: String, type: { type: String, enum: ['image', 'video'] }, width: Number, height: Number }],
    tags: [String],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    visibility: { type: String, enum: ['public', 'connections', 'community'], default: 'public', index: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },

    // Repost
    repostOf: { type: Schema.Types.ObjectId, ref: 'Post', index: true },
    quote: String,

    stats: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      reposts: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      views: { type: Number, default: 0 }
    },

    trendingScore: { type: Number, default: 0, index: true },
    pinned: { type: Boolean, default: false },
    deletedAt: Date
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ content: 'text', tags: 'text' });

export const PostModel = model('Post', PostSchema);
