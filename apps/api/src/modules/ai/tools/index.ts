import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { JobModel } from '../../jobs/jobs.model';
import { CompanyModel } from '../../jobs/company.model';
import { CvModel } from '../../cv/cv.model';
import { UserModel } from '../../auth/auth.model';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'recommendJobs',
      description: 'Search WORK for live job openings matching the user\'s skills, type, remote preference, and salary. Use when the user asks for job suggestions or matches.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text search (titles, skills, companies)' },
          remote: { type: 'boolean' },
          minSalary: { type: 'number', description: 'Minimum salary in USD' },
          skills: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', default: 5, maximum: 10 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'improveCvBullets',
      description: 'Rewrite a draft experience bullet into 2–3 measurable, action-led bullets.',
      parameters: {
        type: 'object',
        required: ['draft'],
        properties: {
          draft: { type: 'string', description: 'The current bullet or paragraph to improve' },
          role: { type: 'string', description: 'Role context' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggestSkills',
      description: 'Suggest 5–10 skills the user should add to their profile based on a target role or industry.',
      parameters: {
        type: 'object',
        required: ['targetRole'],
        properties: {
          targetRole: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'interviewQuestion',
      description: 'Generate one realistic interview question for the user to practice. Returns the question and an outline of what a strong answer covers.',
      parameters: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string' },
          kind: { type: 'string', enum: ['behavioral', 'system-design', 'technical', 'product'], default: 'behavioral' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getMyProfile',
      description: 'Read the current user\'s profile, skills, and latest CV — useful before personalised advice.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

/* ─── Implementations ─── */

export async function runTool(name: string, args: Record<string, unknown>, ctx: { userId: string }): Promise<unknown> {
  switch (name) {
    case 'recommendJobs': return recommendJobs(args, ctx);
    case 'improveCvBullets': return improveCvBullets(args);
    case 'suggestSkills': return suggestSkills(args);
    case 'interviewQuestion': return interviewQuestion(args);
    case 'getMyProfile': return getMyProfile(ctx);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

async function recommendJobs(args: any, ctx: { userId: string }) {
  const filter: Record<string, unknown> = { status: 'open' };
  if (args.query) filter.$text = { $search: String(args.query) };
  if (args.remote === true) filter.remote = true;
  if (args.minSalary) filter.salaryMin = { $gte: Number(args.minSalary) };

  let skills: string[] = Array.isArray(args.skills) ? args.skills : [];
  if (!skills.length) {
    const user = await UserModel.findById(ctx.userId).select('skills').lean();
    skills = (user?.skills as string[]) ?? [];
  }
  if (skills.length) filter.skills = { $in: skills };

  const limit = Math.min(10, Number(args.limit ?? 5));
  const jobs = await JobModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  const companies = await CompanyModel.find({ _id: { $in: jobs.map((j) => j.companyId) } })
    .select('name slug logo').lean();
  const byId = new Map(companies.map((c) => [String(c._id), c]));

  return jobs.map((j) => ({
    id: String(j._id),
    title: j.title,
    company: byId.get(String(j.companyId))?.name,
    companySlug: byId.get(String(j.companyId))?.slug,
    location: j.location ?? (j.remote ? 'Remote' : null),
    salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency,
    type: j.type, experienceLevel: j.experienceLevel,
    skills: j.skills,
    href: `/jobs/${j._id}`
  }));
}

function improveCvBullets(args: any) {
  const role = String(args.role ?? 'professional');
  return {
    bullets: [
      `Led the redesign of [system] that shipped on time and increased [metric] by [%].`,
      `Cut [latency/cost/time] by [%] through [specific change], saving [hours] per [period].`,
      `Mentored [n] ${role}s; [n] promoted within 18 months.`
    ],
    tip: 'Replace bracketed values with real numbers. Strong verbs + measurable outcomes always beat duties.'
  };
}

function suggestSkills(args: any) {
  const role = String(args.targetRole ?? '').toLowerCase();
  const map: Record<string, string[]> = {
    frontend: ['TypeScript', 'React', 'Next.js', 'CSS', 'Tailwind', 'GSAP', 'Framer Motion', 'Web performance'],
    backend: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'gRPC', 'Docker', 'Kubernetes', 'Observability'],
    'product manager': ['Discovery', 'Roadmapping', 'A/B testing', 'SQL', 'Figma', 'OKRs', 'Stakeholder mgmt'],
    designer: ['Figma', 'Design Systems', 'Prototyping', 'Motion', 'Research', 'Accessibility'],
    ml: ['Python', 'PyTorch', 'Transformers', 'CUDA', 'Data engineering', 'MLOps']
  };
  const key = Object.keys(map).find((k) => role.includes(k));
  return { skills: map[key ?? 'frontend'] };
}

function interviewQuestion(args: any) {
  const role = String(args.role ?? 'engineer');
  const kind = args.kind ?? 'behavioral';
  const samples: Record<string, string> = {
    behavioral: `Tell me about a time you had to ship a ${role} project under significant ambiguity. What did you do, what was the outcome, and what would you do differently?`,
    'system-design': `Design a notification system for a social network with 50M users. Walk me through the data model, fan-out strategy, and read path.`,
    technical: `Given an array of intervals, return the minimum number of meeting rooms required.`,
    product: `You launched a feature that hit its primary metric but hurt retention. What do you do next?`
  };
  return {
    question: samples[kind] ?? samples.behavioral,
    rubric: [
      'Clarify scope and constraints first.',
      'Drive to a concrete approach, not just options.',
      'Quantify trade-offs.',
      'Close with what you learned or would do differently.'
    ]
  };
}

async function getMyProfile(ctx: { userId: string }) {
  const user = await UserModel.findById(ctx.userId)
    .select('handle name role headline location skills bio companyName universityName').lean();
  const cv = await CvModel.findOne({ userId: ctx.userId }).sort({ lastEditedAt: -1 }).select('title template lastEditedAt').lean();
  return { user, latestCv: cv };
}
