import { Schema, model } from 'mongoose';

const ReactionSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['like', 'celebrate', 'insightful'], default: 'like' }
  },
  { timestamps: true }
);
ReactionSchema.index({ postId: 1, userId: 1 }, { unique: true });

const BookmarkSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);
BookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });

const FollowSchema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const FriendshipSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    addresseeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending', index: true }
  },
  { timestamps: true }
);
FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });

export const ReactionModel = model('Reaction', ReactionSchema);
export const BookmarkModel = model('Bookmark', BookmarkSchema);
export const FollowModel = model('Follow', FollowSchema);
export const FriendshipModel = model('Friendship', FriendshipSchema);
