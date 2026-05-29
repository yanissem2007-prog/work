import { Schema, model } from 'mongoose';

const CommentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', index: true },
    content: { type: String, required: true, maxlength: 2000 },
    likes: { type: Number, default: 0 },
    deletedAt: Date
  },
  { timestamps: true }
);

CommentSchema.index({ postId: 1, createdAt: -1 });

export const CommentModel = model('Comment', CommentSchema);
