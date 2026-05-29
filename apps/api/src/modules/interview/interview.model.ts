import { Schema, model } from 'mongoose';

export const INTERVIEW_CATEGORIES = ['frontend', 'backend', 'design', 'hr', 'marketing', 'communication'] as const;
export type InterviewCategory = typeof INTERVIEW_CATEGORIES[number];

export const INTERVIEW_LEVELS = ['intern', 'entry', 'mid', 'senior', 'staff'] as const;
export type InterviewLevel = typeof INTERVIEW_LEVELS[number];

const TurnSchema = new Schema({
  question: { type: String, required: true },
  kind: { type: String, default: 'open' }, // open | technical | behavioral
  answer: String,
  feedback: {
    confidence: Number,
    vocabulary: Number,
    technical: Number,
    communication: Number,
    clarity: Number,
    overall: Number,
    coach: String
  },
  answeredAt: Date
}, { _id: true });

const ReportSchema = new Schema({
  score: Number,
  summary: String,
  strengths: [String],
  weaknesses: [String],
  improvements: [String]
}, { _id: false });

const InterviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: INTERVIEW_CATEGORIES, required: true },
    level: { type: String, enum: INTERVIEW_LEVELS, default: 'mid' },
    jobTitle: String,
    totalQuestions: { type: Number, default: 6 },
    skillsContext: [String],
    turns: { type: [TurnSchema], default: [] },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
    report: ReportSchema,
    completedAt: Date
  },
  { timestamps: true }
);
InterviewSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const InterviewModel = model('Interview', InterviewSchema);
