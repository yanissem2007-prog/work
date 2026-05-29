import { Schema, model } from 'mongoose';

export const EVENT_TYPES = ['workshop', 'hackathon', 'conference', 'meetup', 'webinar'] as const;
export type EventType = typeof EVENT_TYPES[number];

export const HOST_TYPES = ['community', 'university', 'user'] as const;
export type HostType = typeof HOST_TYPES[number];

export const RSVP_STATUSES = ['going', 'maybe', 'waitlist', 'cancelled'] as const;
export type RsvpStatus = typeof RSVP_STATUSES[number];

const PrizeSchema = new Schema({
  rank: Number,
  title: String,
  value: String,
  description: String
}, { _id: false });

const SpeakerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  title: String,
  avatar: String
}, { _id: false });

const EventSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    description: { type: String, maxlength: 12000 },
    banner: String,
    accent: String,

    hostType: { type: String, enum: HOST_TYPES, required: true },
    hostId: { type: Schema.Types.ObjectId, required: true, refPath: 'hostRef', index: true },
    hostRef: { type: String, required: true }, // 'Community' | 'User' for refPath
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    online: { type: Boolean, default: true },
    location: String,
    timezone: String,
    meetingUrl: String,

    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },

    capacity: { type: Number, default: 0 }, // 0 = unlimited
    rsvpDeadline: Date,
    requiresApproval: { type: Boolean, default: false },

    tags: [String],
    speakers: [SpeakerSchema],
    prizes: [PrizeSchema],
    sponsors: [{ name: String, logo: String, url: String }],
    rules: [String],

    status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'published', index: true },

    counts: {
      going: { type: Number, default: 0 },
      maybe: { type: Number, default: 0 },
      waitlist: { type: Number, default: 0 }
    },

    reminderSent: { type: Map, of: Boolean, default: {} } // tracks which reminder windows have fired
  },
  { timestamps: true }
);
EventSchema.index({ title: 'text', description: 'text', tags: 'text' });
EventSchema.index({ status: 1, startsAt: 1 });

const RsvpSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: RSVP_STATUSES, default: 'going' },
    role: { type: String, enum: ['attendee', 'speaker', 'organizer'], default: 'attendee' },
    attendedAt: Date
  },
  { timestamps: true }
);
RsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const AnnouncementSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 4000 },
    pinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const EventModel = model('Event', EventSchema);
export const RsvpModel = model('Rsvp', RsvpSchema);
export const EventAnnouncementModel = model('EventAnnouncement', AnnouncementSchema);
