import { Schema, model } from 'mongoose';

const ApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cvId: { type: Schema.Types.ObjectId, ref: 'Cv' },
    status: { type: String, enum: ['submitted', 'reviewing', 'interview', 'offer', 'rejected'], default: 'submitted' },
    timeline: [{ status: String, at: { type: Date, default: Date.now }, note: String }]
  },
  { timestamps: true }
);
ApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
export const ApplicationModel = model('Application', ApplicationSchema);
