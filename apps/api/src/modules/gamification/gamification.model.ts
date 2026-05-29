import { Schema, model } from 'mongoose';

const XpEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    xp: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);
XpEventSchema.index({ userId: 1, createdAt: -1 });

const ProfileGameSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalXp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ id: String, awardedAt: Date }],
    counts: { type: Map, of: Number, default: {} },
    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastActiveDay: String // YYYY-MM-DD
    },
    interviews: {
      count: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const XpEventModel = model('XpEvent', XpEventSchema);
export const ProfileGameModel = model('ProfileGame', ProfileGameSchema);
