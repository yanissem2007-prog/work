import { Schema, model } from 'mongoose';

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1k', '1k-5k', '5k+'] as const;

const CompanySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    logo: String,
    banner: String,
    website: String,
    industry: String,
    size: { type: String, enum: COMPANY_SIZES },
    location: String,
    foundedYear: Number,
    tags: [String],
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followersCount: { type: Number, default: 0 },
    jobsCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);
CompanySchema.index({ name: 'text', description: 'text', industry: 'text', tags: 'text' });

const CompanyFollowSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true }
}, { timestamps: true });
CompanyFollowSchema.index({ userId: 1, companyId: 1 }, { unique: true });

export const CompanyModel = model('Company', CompanySchema);
export const CompanyFollowModel = model('CompanyFollow', CompanyFollowSchema);
