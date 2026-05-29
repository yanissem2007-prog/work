import { Schema, model } from 'mongoose';

const RoomSchema = new Schema(
  {
    type: { type: String, enum: ['dm', 'group', 'community'], required: true, index: true },
    name: String,
    avatar: String,
    members: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      at: Date
    },
    lastMessageAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);
RoomSchema.index({ members: 1, lastMessageAt: -1 });

const ReactionSubSchema = new Schema({
  emoji: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const AttachmentSchema = new Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'file'], required: true },
  name: String,
  size: Number,
  mime: String,
  width: Number,
  height: Number
}, { _id: false });

const MessageSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
    attachments: [AttachmentSchema],
    reactions: [ReactionSubSchema],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    edited: { type: Boolean, default: false },
    deletedAt: Date,
    system: { type: Boolean, default: false }
  },
  { timestamps: true }
);
MessageSchema.index({ roomId: 1, createdAt: -1 });

export const RoomModel = model('Room', RoomSchema);
export const MessageModel = model('Message', MessageSchema);
