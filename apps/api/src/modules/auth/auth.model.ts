import { Schema, model, type InferSchemaType } from 'mongoose';

export const ROLES = ['student', 'recruiter', 'company', 'university', 'admin', 'moderator'] as const;
export type Role = typeof ROLES[number];

const UserSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ROLES, default: 'student', index: true },

    avatar: String,
    headline: String,
    bio: String,
    location: String,
    skills: [String],

    // Role-specific
    companyName: String,      // recruiter / company
    universityName: String,   // university / student
    yearOfStudy: Number,      // student

    oauth: {
      google: { id: String, email: String },
      github: { id: String, username: String }
    },

    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,

    lastLoginAt: Date,
    loginCount: { type: Number, default: 0 },

    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' }
  },
  { timestamps: true }
);

UserSchema.index({ name: 'text', headline: 'text', skills: 'text', bio: 'text' });

UserSchema.methods.toPublic = function () {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.oauth;
  return { ...o, id: String(o._id) };
};

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: string };
export const UserModel = model('User', UserSchema);
