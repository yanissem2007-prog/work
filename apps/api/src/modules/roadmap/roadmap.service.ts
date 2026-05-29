import crypto from 'crypto';
import { z } from 'zod';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { logger } from '../../config/logger';
import { UserModel } from '../auth/auth.model';

const StepZ = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  kind: z.enum(['skill', 'project', 'resource', 'milestone']).default('skill'),
  durationWeeks: z.number().int().min(1).max(26).default(1),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.string().optional()
  })).optional()
});

const PhaseZ = z.object({
  id: z.string().optional(),
  title: z.string(),
  summary: z.string().optional(),
  weeks: z.number().int().min(1).max(52).default(4),
  skills: z.array(z.string()).default([]),
  steps: z.array(StepZ).min(2).max(10)
});

const RoadmapZ = z.object({
  title: z.string(),
  summary: z.string(),
  totalWeeks: z.number().int().min(1).max(208),
  phases: z.array(PhaseZ).min(3).max(8),
  finalProject: z.string().optional(),
  careerPaths: z.array(z.string()).max(6).optional()
});

export type Roadmap = z.infer<typeof RoadmapZ>;

const SYSTEM = `
You generate concrete, actionable learning roadmaps. You are blunt, specific, opinionated.

RULES
- Output strict JSON only.
- 4–6 phases, 3–8 steps per phase, no fluff.
- Each step has measurable scope, realistic durationWeeks.
- Resources should be real and well-known (no invented links — leave url blank if unsure).
- End with a portfolio-grade final project that ties everything together.
- Adapt difficulty + total length to the level field.
`.trim();

export async function generateRoadmap(input: {
  userId: string;
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  hoursPerWeek?: number;
}): Promise<Roadmap> {
  if (!isAIEnabled()) return stub(input);

  const user = await UserModel.findById(input.userId).select('skills headline').lean();
  const prompt = `
USER CONTEXT
- Current skills: ${(user?.skills as string[] | undefined)?.join(', ') || '—'}
- Headline: ${user?.headline ?? '—'}
- Level: ${input.level}
- Hours/week available: ${input.hoursPerWeek ?? 10}

GOAL: "${input.goal}"

Return JSON exactly matching:
{
  "title": string,
  "summary": string,
  "totalWeeks": number,
  "phases": [{
    "title": string,
    "summary": string,
    "weeks": number,
    "skills": string[],
    "steps": [{
      "title": string,
      "description": string,
      "kind": "skill" | "project" | "resource" | "milestone",
      "durationWeeks": number,
      "resources": [{ "title": string, "url"?: string, "type"?: string }]
    }]
  }],
  "finalProject": string,
  "careerPaths": string[]
}
`.trim();

  try {
    const client = openai()!;
    const r = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt }
      ]
    });
    const parsed = RoadmapZ.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
    return addIds(parsed);
  } catch (e) {
    logger.error(e, 'roadmap generation failed — falling back to stub');
    return stub(input);
  }
}

function addIds(rm: Roadmap): Roadmap {
  return {
    ...rm,
    phases: rm.phases.map((p) => ({
      ...p,
      id: p.id ?? crypto.randomUUID(),
      steps: p.steps.map((s) => ({ ...s, id: s.id ?? crypto.randomUUID() }))
    }))
  };
}

/* ─── Deterministic stub for offline mode ─── */
function stub(input: { goal: string; level: string }): Roadmap {
  const goal = input.goal.toLowerCase();
  const isFs = goal.includes('full stack') || goal.includes('fullstack');
  const isData = goal.includes('data') || goal.includes('ml') || goal.includes('ai');
  const isDesign = goal.includes('design');

  const fs: Roadmap = {
    title: `Become a ${input.goal}`,
    summary: `A 24-week, project-driven roadmap to ship production-grade full-stack apps and land your first role.`,
    totalWeeks: 24,
    phases: [
      {
        id: crypto.randomUUID(),
        title: 'Foundations',
        summary: 'JS/TS fluency, HTML, CSS, and the web platform.',
        weeks: 4,
        skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Git'],
        steps: [
          { id: crypto.randomUUID(), title: 'TypeScript fundamentals', description: 'Generics, narrowing, utility types.', kind: 'skill', durationWeeks: 2 },
          { id: crypto.randomUUID(), title: 'Modern CSS', description: 'Grid, Flexbox, container queries, CSS variables.', kind: 'skill', durationWeeks: 1 },
          { id: crypto.randomUUID(), title: 'Personal landing page', description: 'Static site deployed to Vercel.', kind: 'project', durationWeeks: 1 }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Frontend mastery',
        summary: 'React, state management, accessibility, performance.',
        weeks: 6,
        skills: ['React', 'Next.js', 'Tailwind', 'Web Vitals'],
        steps: [
          { id: crypto.randomUUID(), title: 'Next.js App Router', description: 'Server components, routing, data fetching.', kind: 'skill', durationWeeks: 3 },
          { id: crypto.randomUUID(), title: 'Build a feed clone', description: 'Twitter-style feed with optimistic updates.', kind: 'project', durationWeeks: 2 },
          { id: crypto.randomUUID(), title: 'A11y + perf audit', description: 'Lighthouse > 95 across the board.', kind: 'milestone', durationWeeks: 1 }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Backend & APIs',
        summary: 'Node, databases, auth, file handling.',
        weeks: 6,
        skills: ['Node.js', 'Express', 'PostgreSQL', 'REST', 'JWT'],
        steps: [
          { id: crypto.randomUUID(), title: 'Design a REST API', description: 'Routing, validation, error envelopes.', kind: 'skill', durationWeeks: 2 },
          { id: crypto.randomUUID(), title: 'Auth: JWT + OAuth', description: 'Refresh rotation, secure cookies.', kind: 'skill', durationWeeks: 2 },
          { id: crypto.randomUUID(), title: 'Build a SaaS backend', description: 'Multi-tenant, billing-ready.', kind: 'project', durationWeeks: 2 }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Production-grade',
        summary: 'DevOps, testing, observability.',
        weeks: 4,
        skills: ['Docker', 'CI/CD', 'Playwright', 'OpenTelemetry'],
        steps: [
          { id: crypto.randomUUID(), title: 'Containerize an app', description: 'Multi-stage Dockerfile + docker-compose.', kind: 'skill', durationWeeks: 1 },
          { id: crypto.randomUUID(), title: 'E2E tests with Playwright', kind: 'skill', durationWeeks: 1 },
          { id: crypto.randomUUID(), title: 'Ship CI/CD pipeline', kind: 'project', durationWeeks: 2 }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Capstone & launch',
        summary: 'Portfolio site, interview prep, first applications.',
        weeks: 4,
        skills: ['System design', 'Interviewing', 'Portfolio'],
        steps: [
          { id: crypto.randomUUID(), title: 'System design study', kind: 'skill', durationWeeks: 2 },
          { id: crypto.randomUUID(), title: 'Capstone project', description: 'Production-ready, deployed, with docs.', kind: 'project', durationWeeks: 2 },
          { id: crypto.randomUUID(), title: 'Apply to 30 roles', kind: 'milestone', durationWeeks: 1 }
        ]
      }
    ],
    finalProject: 'A multi-tenant SaaS with auth, payments, dashboards, and end-to-end tests — deployed.',
    careerPaths: ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'Founding Engineer']
  };

  // Lightweight branches for non-FS goals (still deterministic, shape-stable).
  if (isData) {
    fs.title = `Become a Data / ML Engineer`;
    fs.phases[0].skills = ['Python', 'NumPy', 'Pandas', 'SQL'];
    fs.phases[1].title = 'Modeling & training';
    fs.phases[1].skills = ['PyTorch', 'scikit-learn', 'Vector math'];
    fs.finalProject = 'A trained model deployed via a FastAPI service with online + offline metrics.';
    fs.careerPaths = ['Data Engineer', 'ML Engineer', 'AI Research Engineer'];
  } else if (isDesign) {
    fs.title = `Become a Senior Product Designer`;
    fs.phases[0].skills = ['Figma', 'Type', 'Color'];
    fs.phases[1].title = 'Systems & motion';
    fs.phases[1].skills = ['Design Systems', 'Tokens', 'Motion'];
    fs.finalProject = 'A redesigned product flow with research, system, prototype, and case study.';
    fs.careerPaths = ['Product Designer', 'Design Engineer', 'Brand Designer'];
  }
  return addIds(fs);
}

export function progressOf(roadmap: any): { stepsTotal: number; stepsDone: number } {
  let total = 0; let done = 0;
  for (const p of roadmap.phases ?? []) {
    for (const s of p.steps ?? []) {
      total++; if (s.done) done++;
    }
  }
  return { stepsTotal: total, stepsDone: done };
}
