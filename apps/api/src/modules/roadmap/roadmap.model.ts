import { Schema, model } from 'mongoose';

const StepSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  kind: { type: String, enum: ['skill', 'project', 'resource', 'milestone'], default: 'skill' },
  durationWeeks: { type: Number, default: 1 },
  resources: [{ title: String, url: String, type: String }],
  done: { type: Boolean, default: false },
  doneAt: Date
}, { _id: false });

const PhaseSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  summary: String,
  weeks: { type: Number, default: 4 },
  skills: [String],
  steps: { type: [StepSchema], default: [] }
}, { _id: false });

const RoadmapSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goal: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    title: String,
    summary: String,
    totalWeeks: Number,
    phases: { type: [PhaseSchema], default: [] },
    finalProject: String,
    careerPaths: [String],
    progress: {
      stepsTotal: { type: Number, default: 0 },
      stepsDone: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);
RoadmapSchema.index({ userId: 1, createdAt: -1 });

export const RoadmapModel = model('Roadmap', RoadmapSchema);
