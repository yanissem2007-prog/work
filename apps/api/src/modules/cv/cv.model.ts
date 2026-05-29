import { Schema, model } from 'mongoose';

export const TEMPLATES = ['minimal', 'editorial', 'brutalist', 'mono'] as const;
export type Template = typeof TEMPLATES[number];

export const SECTION_TYPES = [
  'personal', 'summary', 'experience', 'education',
  'skills', 'projects', 'certifications', 'languages', 'links'
] as const;
export type SectionType = typeof SECTION_TYPES[number];

const SectionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: SECTION_TYPES, required: true },
  title: String,
  visible: { type: Boolean, default: true },
  items: { type: Schema.Types.Mixed, default: [] },
  content: String
}, { _id: false });

const CvSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Untitled CV' },
    template: { type: String, enum: TEMPLATES, default: 'minimal' },
    accent: { type: String, default: 'oklch(62% 0.22 264)' },
    sections: { type: [SectionSchema], default: [] },
    publicSlug: { type: String, unique: true, sparse: true },
    pdfUrl: String,
    lastEditedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
CvSchema.index({ userId: 1, lastEditedAt: -1 });

export const CvModel = model('Cv', CvSchema);
