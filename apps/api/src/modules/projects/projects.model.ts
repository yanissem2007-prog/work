import { Schema, model } from 'mongoose';

export const PROJECT_KINDS = ['portfolio', 'github', 'startup', 'challenge', 'realworld'] as const;
export const PROJECT_DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'] as const;
export const PROJECT_STATUSES = ['suggested', 'saved', 'in_progress', 'built'] as const;
export type ProjectKind = typeof PROJECT_KINDS[number];

const ProjectIdeaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: PROJECT_KINDS, required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    why: String,
    stack: [String],
    skills: [String],
    difficulty: { type: String, enum: PROJECT_DIFFICULTIES, default: 'medium' },
    estimatedWeeks: { type: Number, default: 2 },
    deliverables: [String],
    nextSteps: [String],
    status: { type: String, enum: PROJECT_STATUSES, default: 'suggested', index: true },
    repoUrl: String,
    demoUrl: String,
    color: String
  },
  { timestamps: true }
);
ProjectIdeaSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const ProjectIdeaModel = model('ProjectIdea', ProjectIdeaSchema);
