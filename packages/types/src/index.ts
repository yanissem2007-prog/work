export type Role = 'student' | 'recruiter' | 'company' | 'university' | 'admin' | 'moderator';

export type CvTemplate = 'minimal' | 'editorial' | 'brutalist' | 'mono';
export type CvSectionType =
  | 'personal' | 'summary' | 'experience' | 'education'
  | 'skills' | 'projects' | 'certifications' | 'languages' | 'links';

export interface CvSection {
  id: string;
  type: CvSectionType;
  title?: string;
  visible: boolean;
  items?: Record<string, unknown>[];
  content?: string;
}

export interface Cv {
  _id: string;
  userId: string;
  title: string;
  template: CvTemplate;
  accent: string;
  sections: CvSection[];
  publicSlug?: string;
  pdfUrl?: string;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  companyName?: string;
  universityName?: string;
  yearOfStudy?: number;
  emailVerified: boolean;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export type JobType = 'full-time' | 'part-time' | 'internship' | 'contract';
export type ExperienceLevel = 'intern' | 'entry' | 'mid' | 'senior' | 'staff' | 'principal';
export type ApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface Company {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  foundedYear?: number;
  tags?: string[];
  followersCount?: number;
  jobsCount?: number;
  verified?: boolean;
}

export interface Job {
  _id: string;
  companyId: string;
  recruiterId: string;
  title: string;
  description: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  remote: boolean;
  location?: string;
  region?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  skills: string[];
  benefits?: string[];
  applyUrl?: string;
  status: 'open' | 'closed' | 'draft';
  applicantsCount?: number;
  viewsCount?: number;
  createdAt: string;
  company?: Company;
}

export interface Application {
  _id: string;
  jobId: string;
  userId: string;
  companyId: string;
  cvUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  timeline: { status: ApplicationStatus; at: string; note?: string }[];
  createdAt: string;
  job?: Job;
  applicant?: Pick<User, 'handle' | 'name' | 'avatar' | 'headline' | 'location' | 'skills'>;
}

export interface Post {
  id: string;
  author: Pick<User, 'id' | 'handle' | 'name' | 'avatar' | 'headline' | 'role'>;
  content: string;
  media?: { url: string; type: 'image' | 'video'; width?: number; height?: number }[];
  tags?: string[];
  visibility: 'public' | 'connections' | 'community';
  stats: { likes: number; comments: number; reposts: number; bookmarks: number; views: number };
  repostOf?: Post;
  quote?: string;
  pinned?: boolean;
  createdAt: string;
  viewer?: { liked: boolean; bookmarked: boolean };
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likes: number;
  createdAt: string;
  author: Pick<User, 'handle' | 'name' | 'avatar' | 'headline'>;
}

export interface Profile {
  cover?: string;
  pronouns?: string;
  experience?: Array<{ company: string; role: string; start?: string; end?: string; current?: boolean; description?: string; location?: string }>;
  education?: Array<{ school: string; degree?: string; field?: string; start?: string; end?: string; description?: string }>;
  portfolio?: Array<{ title: string; url?: string; image?: string; description?: string }>;
  socials?: { twitter?: string; github?: string; linkedin?: string; website?: string; dribbble?: string };
  openToWork?: boolean;
  hiring?: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  attachments?: { url: string; type: string }[];
  readBy: string[];
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  type: 'dm' | 'group' | 'community';
  members: string[];
  lastMessageAt?: string;
  unread?: number;
}

export interface Community {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  accent?: string;
  rules?: { title: string; body: string }[];
  ownerId: string;
  membersCount: number;
  visibility: 'public' | 'private';
  channels: Channel[];
  tags?: string[];
  viewer?: { role?: CommunityRole; banned: boolean; mutedUntil?: string };
}

export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ChannelType = 'text' | 'announcement' | 'resource' | 'event';

export interface Channel {
  _id: string;
  name: string;
  slug: string;
  type: ChannelType;
  topic?: string;
  position: number;
  readOnlyFor?: CommunityRole[];
}

export interface ChannelMessage {
  _id: string;
  channelId: string;
  communityId: string;
  authorId: string;
  content: string;
  attachments?: { url: string; type: 'image' | 'video' | 'file'; name?: string; size?: number; mime?: string }[];
  reactions?: { emoji: string; userId: string }[];
  edited?: boolean;
  pinned?: boolean;
  createdAt: string;
  author?: Pick<User, 'handle' | 'name' | 'avatar' | 'headline'>;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'message' | 'job-match' | 'application-status';
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { total?: number; cursor?: string };
}
