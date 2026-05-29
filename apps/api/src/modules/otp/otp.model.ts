import { Schema, model } from 'mongoose';

const OtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['login', 'signup', 'sensitive'], default: 'login' },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    sentTo: String,
    ip: String,
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL: auto-purge after expiry
  },
  { timestamps: true }
);
OtpSchema.index({ userId: 1, createdAt: -1 });

export const OtpModel = model('Otp', OtpSchema);
