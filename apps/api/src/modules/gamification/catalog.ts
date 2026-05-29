/**
 * Event catalog: every awardable action with XP value + optional cooldown.
 * Keep IDs stable — they're persisted in XpEvent docs.
 */
export const XP_EVENTS = {
  'auth.signup':           { xp: 50,  oncePerLife: true },
  'profile.complete':      { xp: 100, oncePerLife: true },
  'profile.avatar':        { xp: 15,  oncePerLife: true },
  'cv.create':             { xp: 25,  oncePerLife: true },
  'cv.export':             { xp: 10 },
  'cv.analyze':            { xp: 30,  dailyCap: 60 },
  'post.create':           { xp: 5,   dailyCap: 30 },
  'post.liked-by-others':  { xp: 1,   dailyCap: 20 },
  'comment.create':        { xp: 2,   dailyCap: 20 },
  'community.create':      { xp: 50,  oncePerLife: true },
  'community.join':        { xp: 5 },
  'channel.message':       { xp: 1,   dailyCap: 20 },
  'job.apply':             { xp: 10,  dailyCap: 60 },
  'job.save':              { xp: 2 },
  'interview.complete':    { xp: 40 },
  'interview.score90':     { xp: 60 },
  'friend.add':            { xp: 5 },
  'streak.day':            { xp: 10 }
} as const;

export type XpEventId = keyof typeof XP_EVENTS;

/* ─── Badges ─── */

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string; // lucide name
  /** Predicate evaluated against a user's stat aggregate. */
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  level: number;
  totalXp: number;
  counts: Record<XpEventId, number>;
  bestStreak: number;
  currentStreak: number;
  interviews: { count: number; bestScore: number };
}

export const BADGES: BadgeDef[] = [
  { id: 'first-step',   name: 'First Step',         description: 'Joined WORK.',                       rarity: 'common',    icon: 'Sparkles',   check: (s) => (s.counts['auth.signup'] ?? 0) > 0 },
  { id: 'cv-creator',   name: 'CV Architect',       description: 'Created your first CV.',             rarity: 'common',    icon: 'FileText',   check: (s) => (s.counts['cv.create'] ?? 0) > 0 },
  { id: 'cv-analyst',   name: 'CV Analyst',         description: 'Ran your first CV Score.',           rarity: 'common',    icon: 'Gauge',      check: (s) => (s.counts['cv.analyze'] ?? 0) > 0 },
  { id: 'apply-10',     name: 'On the Hunt',        description: 'Applied to 10 jobs.',                rarity: 'rare',      icon: 'Briefcase',  check: (s) => (s.counts['job.apply'] ?? 0) >= 10 },
  { id: 'apply-50',     name: 'Job Marathoner',     description: 'Applied to 50 jobs.',                rarity: 'epic',      icon: 'Briefcase',  check: (s) => (s.counts['job.apply'] ?? 0) >= 50 },
  { id: 'first-post',   name: 'First Voice',        description: 'Posted to the feed.',                rarity: 'common',    icon: 'Mic',        check: (s) => (s.counts['post.create'] ?? 0) > 0 },
  { id: 'community-100',name: 'Community Contributor', description: '100 channel messages sent.',     rarity: 'rare',      icon: 'Users',      check: (s) => (s.counts['channel.message'] ?? 0) >= 100 },
  { id: 'founder',      name: 'Founder',            description: 'Created a community.',               rarity: 'epic',      icon: 'Crown',      check: (s) => (s.counts['community.create'] ?? 0) > 0 },
  { id: 'interview-1',  name: 'Practice Makes Perfect', description: 'Completed your first mock interview.', rarity: 'common', icon: 'Award',  check: (s) => s.interviews.count >= 1 },
  { id: 'interview-ace',name: 'Interview Ace',      description: 'Scored 90+ on a mock interview.',    rarity: 'legendary', icon: 'Trophy',     check: (s) => s.interviews.bestScore >= 90 },
  { id: 'streak-7',     name: 'On Fire',            description: '7-day streak.',                      rarity: 'rare',      icon: 'Flame',      check: (s) => s.bestStreak >= 7 },
  { id: 'streak-30',    name: 'Unstoppable',        description: '30-day streak.',                     rarity: 'legendary', icon: 'Flame',      check: (s) => s.bestStreak >= 30 },
  { id: 'level-10',     name: 'Ten of Ten',         description: 'Reached level 10.',                  rarity: 'rare',      icon: 'Zap',        check: (s) => s.level >= 10 },
  { id: 'level-25',     name: 'Quarter Century',    description: 'Reached level 25.',                  rarity: 'epic',      icon: 'Zap',        check: (s) => s.level >= 25 },
  { id: 'social-50',    name: 'Networker',          description: 'Made 50 connections.',               rarity: 'rare',      icon: 'UserPlus',   check: (s) => (s.counts['friend.add'] ?? 0) >= 50 }
];

/** XP needed to reach level N. Cumulative, slightly super-linear. */
export function xpToReach(level: number): number {
  if (level <= 1) return 0;
  // 0, 100, 250, 450, 700, 1000, 1350, …
  return Math.round(50 * level * (level - 1) + 100 * (level - 1));
}

export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpForNext: number; progress: number } {
  let level = 1;
  while (xpToReach(level + 1) <= xp) level++;
  const floor = xpToReach(level);
  const ceil = xpToReach(level + 1);
  const xpInLevel = xp - floor;
  const xpForNext = ceil - floor;
  return { level, xpInLevel, xpForNext, progress: xpForNext > 0 ? xpInLevel / xpForNext : 1 };
}
