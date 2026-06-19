/**
 * Seed the database with realistic demo data so the feed, jobs, communities
 * and network feel alive on a fresh install.
 *
 * Run from repo root:   npm run seed
 * Or from apps/api:      npm run seed
 *
 * Login afterwards with:  demo@work.app  /  password123
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { logger } from '../config/logger';

import { UserModel } from '../modules/auth/auth.model';
import { PostModel } from '../modules/posts/posts.model';
import { FollowModel } from '../modules/posts/interactions.model';
import { CompanyModel } from '../modules/jobs/company.model';
import { JobModel } from '../modules/jobs/jobs.model';
import { CommunityModel, MembershipModel } from '../modules/communities/communities.model';

const PASSWORD = 'password123';

const PEOPLE = [
  { handle: 'demo', name: 'Demo User', email: 'demo@work.app', role: 'student', headline: 'Full-stack student · Algiers', skills: ['TypeScript', 'React', 'Node.js'] },
  { handle: 'sara', name: 'Sara Bouali', email: 'sara@work.app', role: 'student', headline: 'Senior Product Designer', skills: ['Figma', 'Design Systems', 'Motion'] },
  { handle: 'yanis', name: 'Yanis Berrouba', email: 'yanis@work.app', role: 'recruiter', headline: 'Founder · Atlas', skills: ['Hiring', 'Product'] },
  { handle: 'mia', name: 'Mia Tanaka', email: 'mia@work.app', role: 'recruiter', headline: 'Head of Talent · Linear', skills: ['Recruiting'] },
  { handle: 'omar', name: 'Omar K.', email: 'omar@work.app', role: 'student', headline: 'Frontend Engineer', skills: ['React', 'CSS', 'GSAP'] },
  { handle: 'aicha', name: 'Aïcha L.', email: 'aicha@work.app', role: 'student', headline: 'ML Engineer', skills: ['Python', 'PyTorch', 'CUDA'] },
  { handle: 'leo', name: 'Leo Martin', email: 'leo@work.app', role: 'student', headline: 'iOS Developer', skills: ['Swift', 'UIKit'] },
  { handle: 'nour', name: 'Nour H.', email: 'nour@work.app', role: 'student', headline: 'Growth & Brand', skills: ['Marketing', 'Content'] }
];

const POSTS = [
  'Shipped our new onboarding flow today — activation up 38%. The team killed it. 🚀',
  'Hot take: one shipped project beats five tutorials. Build in public.',
  'We are hiring 2 design engineers at Atlas. DM me if motion + systems is your thing.',
  'Spent the weekend rebuilding my portfolio with Next.js + Framer Motion. Worth it.',
  'Reminder: your network is your net worth. Comment one thing you shipped this week.',
  'Just passed a Staff-level system design loop. Happy to share my prep notes. 🧵',
  'CSS container queries changed how I build responsive components. No more media-query soup.',
  'Algeria tech scene is heating up. Who is building something cool right now?',
  'Mock interviews on WORK got me 3 callbacks. The AI feedback is unreasonably good.',
  'Design tip: contrast in scale > decoration. Make one thing huge, keep the rest quiet.'
];

const COMPANIES = [
  { slug: 'stripe', name: 'Stripe', industry: 'Fintech', size: '5k+', location: 'Remote', accent: 'oklch(62% 0.2 264)' },
  { slug: 'linear', name: 'Linear', industry: 'Productivity', size: '51-200', location: 'San Francisco', accent: 'oklch(70% 0.18 280)' },
  { slug: 'vercel', name: 'Vercel', industry: 'Developer Tools', size: '201-500', location: 'NYC', accent: 'oklch(20% 0 0)' },
  { slug: 'anthropic', name: 'Anthropic', industry: 'AI', size: '501-1k', location: 'Remote', accent: 'oklch(72% 0.12 60)' }
];

const JOBS = [
  { title: 'Senior Frontend Engineer', company: 'stripe', type: 'full-time', experienceLevel: 'senior', remote: true, region: 'NA', salaryMin: 220000, salaryMax: 280000, skills: ['TypeScript', 'React', 'GraphQL'] },
  { title: 'Design Engineer', company: 'linear', type: 'full-time', experienceLevel: 'mid', remote: false, location: 'San Francisco', region: 'NA', salaryMin: 190000, salaryMax: 240000, skills: ['Motion', 'Design Systems', 'CSS'] },
  { title: 'Founding Engineer', company: 'vercel', type: 'full-time', experienceLevel: 'senior', remote: false, location: 'NYC', region: 'NA', salaryMin: 240000, salaryMax: 320000, skills: ['Next.js', 'Edge', 'TypeScript'] },
  { title: 'Staff ML Engineer', company: 'anthropic', type: 'full-time', experienceLevel: 'staff', remote: true, region: 'NA', salaryMin: 330000, salaryMax: 420000, skills: ['Python', 'PyTorch', 'LLM'] },
  { title: 'Frontend Intern', company: 'linear', type: 'internship', experienceLevel: 'intern', remote: true, region: 'EMEA', salaryMin: 40000, salaryMax: 60000, skills: ['React', 'TypeScript'] },
  { title: 'Product Designer', company: 'stripe', type: 'full-time', experienceLevel: 'mid', remote: true, region: 'EMEA', salaryMin: 120000, salaryMax: 160000, skills: ['Figma', 'Prototyping'] }
];

const COMMUNITIES = [
  { slug: 'frontend-cult', name: 'Frontend Cult', description: 'React, motion, CSS wizardry.', accent: 'oklch(72% 0.2 264)', tags: ['React', 'CSS'] },
  { slug: 'algeria-tech', name: 'Algeria Tech', description: 'Builders & founders from Algeria.', accent: 'oklch(80% 0.14 200)', tags: ['Startup'] },
  { slug: 'design-heroes', name: 'Design Heroes', description: 'Product design, systems, craft.', accent: 'oklch(70% 0.24 340)', tags: ['Figma', 'Systems'] }
];

async function seed() {
  await connectDB();
  logger.info('seeding…');

  const reset = process.argv.includes('--reset');
  if (reset) {
    await Promise.all([
      UserModel.deleteMany({}), PostModel.deleteMany({}), FollowModel.deleteMany({}),
      CompanyModel.deleteMany({}), JobModel.deleteMany({}),
      CommunityModel.deleteMany({}), MembershipModel.deleteMany({})
    ]);
    logger.info('collections reset');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Users (upsert by email)
  const users: Record<string, any> = {};
  for (const p of PEOPLE) {
    const u = await UserModel.findOneAndUpdate(
      { email: p.email },
      { $set: { ...p, passwordHash, status: 'active', emailVerified: true } },
      { new: true, upsert: true }
    );
    users[p.handle] = u;
  }
  logger.info(`users: ${Object.keys(users).length}`);

  // Follows — everyone follows the first 3 "influencers"
  const influencers = [users.sara, users.yanis, users.mia];
  for (const u of Object.values(users)) {
    for (const inf of influencers) {
      if (String(u._id) === String(inf._id)) continue;
      await FollowModel.updateOne(
        { followerId: u._id, followingId: inf._id },
        { $setOnInsert: { followerId: u._id, followingId: inf._id } },
        { upsert: true }
      );
    }
  }
  logger.info('follows wired');

  // Companies (owned by recruiter yanis)
  const companies: Record<string, any> = {};
  for (const c of COMPANIES) {
    const co = await CompanyModel.findOneAndUpdate(
      { slug: c.slug },
      { $set: { ...c, ownerId: users.yanis._id, verified: true } },
      { new: true, upsert: true }
    );
    companies[c.slug] = co;
  }
  logger.info(`companies: ${Object.keys(companies).length}`);

  // Jobs
  let jobCount = 0;
  for (const j of JOBS) {
    const co = companies[j.company];
    const exists = await JobModel.findOne({ title: j.title, companyId: co._id });
    if (exists) continue;
    await JobModel.create({
      ...j,
      companyId: co._id,
      recruiterId: users.yanis._id,
      description: `We are looking for a ${j.title}. You will ship product end to end, work with a small senior team, and own meaningful surface area. Strong fundamentals in ${j.skills.join(', ')} expected.`,
      status: 'open',
      currency: j.salaryMin && j.salaryMin < 80000 ? 'EUR' : 'USD'
    });
    jobCount++;
  }
  logger.info(`jobs: ${jobCount}`);

  // Posts — round-robin authors
  const authors = Object.values(users);
  let postCount = 0;
  for (let i = 0; i < POSTS.length; i++) {
    const author = authors[i % authors.length];
    const exists = await PostModel.findOne({ content: POSTS[i] });
    if (exists) continue;
    await PostModel.create({
      authorId: author._id,
      content: POSTS[i],
      visibility: 'public',
      tags: ['career', 'tech'],
      stats: {
        likes: Math.floor(Math.random() * 1200),
        comments: Math.floor(Math.random() * 140),
        reposts: Math.floor(Math.random() * 80),
        bookmarks: Math.floor(Math.random() * 60),
        views: Math.floor(Math.random() * 9000)
      },
      trendingScore: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - i * 3 * 3600_000)
    });
    postCount++;
  }
  logger.info(`posts: ${postCount}`);

  // Communities (owned by demo) + memberships
  for (const c of COMMUNITIES) {
    const com = await CommunityModel.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          ...c, ownerId: users.demo._id, visibility: 'public',
          channels: [
            { name: 'welcome', slug: 'welcome', type: 'announcement', position: 0, readOnlyFor: ['member'] },
            { name: 'general', slug: 'general', type: 'text', position: 1 },
            { name: 'resources', slug: 'resources', type: 'resource', position: 2 }
          ]
        },
        $setOnInsert: { membersCount: 0 }
      },
      { new: true, upsert: true }
    );
    // members: demo (owner) + a few others
    const members = [users.demo, users.sara, users.omar, users.aicha];
    let added = 0;
    for (const m of members) {
      const r = await MembershipModel.updateOne(
        { communityId: com._id, userId: m._id },
        { $setOnInsert: { communityId: com._id, userId: m._id, role: String(m._id) === String(users.demo._id) ? 'owner' : 'member' } },
        { upsert: true }
      );
      if (r.upsertedCount) added++;
    }
    if (added) await CommunityModel.updateOne({ _id: com._id }, { $inc: { membersCount: added } });
  }
  logger.info(`communities: ${COMMUNITIES.length}`);

  logger.info('────────────────────────────────────────');
  logger.info('✅ Seed complete.');
  logger.info('   Login:  demo@work.app  /  password123');
  logger.info('────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => { logger.error(e); process.exit(1); });
