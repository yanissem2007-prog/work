import { Schema, model } from 'mongoose';

export const EMPLOYMENT_STATUSES = ['current', 'former', 'intern', 'contractor'] as const;
export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];

const BreakdownSchema = new Schema({
  culture:    { type: Number, min: 1, max: 5, required: true },
  comp:       { type: Number, min: 1, max: 5, required: true },
  worklife:   { type: Number, min: 1, max: 5, required: true },
  management: { type: Number, min: 1, max: 5, required: true },
  growth:     { type: Number, min: 1, max: 5, required: true }
}, { _id: false });

const CompanyReviewSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    authorId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    rating:       { type: Number, min: 1, max: 5, required: true },
    breakdown:    { type: BreakdownSchema, required: true },
    title:        { type: String, required: true, maxlength: 140 },
    pros:         { type: String, maxlength: 4000 },
    cons:         { type: String, maxlength: 4000 },
    advice:       { type: String, maxlength: 2000 },
    recommend:    { type: Boolean, default: true },

    role:               String,
    employmentStatus:   { type: String, enum: EMPLOYMENT_STATUSES, required: true },
    tenureYears:        { type: Number, min: 0, max: 60 },
    location:           String,

    anonymous:    { type: Boolean, default: false },
    helpfulBy:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
    flagged:      { type: Boolean, default: false },
    status:       { type: String, enum: ['active', 'flagged', 'removed'], default: 'active', index: true }
  },
  { timestamps: true }
);
CompanyReviewSchema.index({ companyId: 1, createdAt: -1 });
CompanyReviewSchema.index({ companyId: 1, authorId: 1 }, { unique: true });

export const CompanyReviewModel = model('CompanyReview', CompanyReviewSchema);
