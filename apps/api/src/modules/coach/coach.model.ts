import { Schema, model } from 'mongoose';

export const COACH_FOCUS = ['career', 'learning', 'profile', 'tech', 'interview'] as const;
export type CoachFocus = typeof COACH_FOCUS[number];

const PlanStepSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  action: String,
  due: Date,
  done: { type: Boolean, default: false },
  doneAt: Date
}, { _id: false });

const CheckInSchema = new Schema({
  at: { type: Date, default: Date.now },
  mood: { type: String, enum: ['stuck', 'okay', 'great'] },
  win: String,
  block: String,
  next: String,
  insight: String
}, { _id: false });

const CoachSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    focus: { type: String, enum: COACH_FOCUS, required: true },
    goal: { type: String, required: true, maxlength: 280 },
    horizonWeeks: { type: Number, default: 12 },
    summary: String,
    plan: { type: [PlanStepSchema], default: [] },
    insights: [String],
    checkIns: { type: [CheckInSchema], default: [] },
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active', index: true },
    completedAt: Date
  },
  { timestamps: true }
);
CoachSessionSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const CoachSessionModel = model('CoachSession', CoachSessionSchema);
