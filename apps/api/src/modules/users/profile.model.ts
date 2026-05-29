import { Schema, model } from 'mongoose';

const ExperienceSchema = new Schema({
  company: String,
  role: String,
  start: Date,
  end: Date,
  current: Boolean,
  description: String,
  location: String
}, { _id: true });

const EducationSchema = new Schema({
  school: String,
  degree: String,
  field: String,
  start: Date,
  end: Date,
  description: String
}, { _id: true });

const PortfolioItemSchema = new Schema({
  title: String,
  url: String,
  image: String,
  description: String
}, { _id: true });

const ProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    cover: String,
    pronouns: String,
    experience: [ExperienceSchema],
    education: [EducationSchema],
    portfolio: [PortfolioItemSchema],
    cvId: { type: Schema.Types.ObjectId, ref: 'Cv' },
    socials: {
      twitter: String, github: String, linkedin: String, website: String, dribbble: String
    },
    openToWork: { type: Boolean, default: false },
    hiring: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ProfileModel = model('Profile', ProfileSchema);
