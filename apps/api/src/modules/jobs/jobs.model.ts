import { Schema, model } from 'mongoose';

export const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'] as const;
export const EXPERIENCE_LEVELS = ['intern', 'entry', 'mid', 'senior', 'staff', 'principal'] as const;
export const APPLICATION_STATUSES = ['submitted', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn'] as const;

const JobSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: JOB_TYPES, default: 'full-time', index: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: 'mid', index: true },
    remote: { type: Boolean, default: false, index: true },
    location: String,
    region: String, // e.g. "EMEA", "NA", "APAC", "MENA"
    salaryMin: { type: Number, index: true },
    salaryMax: Number,
    currency: { type: String, default: 'USD' },
    skills: { type: [String], index: true },
    benefits: [String],
    applyUrl: String,
    status: { type: String, enum: ['open', 'closed', 'draft'], default: 'open', index: true },
    applicantsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    expiresAt: Date,
    embedding: { type: [Number], select: false }
  },
  { timestamps: true }
);
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });

const ApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    cvUrl: String,
    coverLetter: String,
    status: { type: String, enum: APPLICATION_STATUSES, default: 'submitted', index: true },
    timeline: [{
      status: { type: String, enum: APPLICATION_STATUSES },
      at: { type: Date, default: Date.now },
      note: String,
      byUserId: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    withdrawnAt: Date
  },
  { timestamps: true }
);
ApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
ApplicationSchema.index({ userId: 1, createdAt: -1 });

const SavedJobSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true }
}, { timestamps: true });
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const JobModel = model('Job', JobSchema);
export const ApplicationModel = model('Application', ApplicationSchema);
export const SavedJobModel = model('SavedJob', SavedJobSchema);
