import { Schema, model } from 'mongoose';

const ReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: String,
    pages: Number,
    wordCount: Number,
    score: { type: Number, required: true },
    report: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);
ReportSchema.index({ userId: 1, createdAt: -1 });

export const CvReportModel = model('CvReport', ReportSchema);
