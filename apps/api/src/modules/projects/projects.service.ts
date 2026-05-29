import { z } from 'zod';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { logger } from '../../config/logger';
import { UserModel } from '../auth/auth.model';
import { PROJECT_KINDS, PROJECT_DIFFICULTIES, type ProjectKind } from './projects.model';

const IdeaZ = z.object({
  kind: z.enum(PROJECT_KINDS),
  title: z.string(),
  summary: z.string(),
  why: z.string().optional(),
  stack: z.array(z.string()).max(10),
  skills: z.array(z.string()).max(10),
  difficulty: z.enum(PROJECT_DIFFICULTIES).default('medium'),
  estimatedWeeks: z.number().int().min(1).max(26).default(2),
  deliverables: z.array(z.string()).max(8).optional(),
  nextSteps: z.array(z.string()).max(6).optional()
});

const BatchZ = z.object({ ideas: z.array(IdeaZ).min(3).max(8) });
export type Idea = z.infer<typeof IdeaZ>;

const TONES: Record<ProjectKind, string> = {
  portfolio: 'oklch(72% 0.2 264)',
  github: 'oklch(78% 0.06 0)',
  startup: 'oklch(70% 0.24 340)',
  challenge: 'oklch(78% 0.22 142)',
  realworld: 'oklch(75% 0.22 50)'
};

const SYSTEM = `
You generate project ideas tailored to a developer's profile.
Each idea must be specific, buildable, and tied to a clear outcome.
No generic CRUD apps. Output strict JSON only.
`.trim();

export async function generateIdeas(input: {
  userId: string; goal?: string; kinds?: ProjectKind[]; count?: number;
}): Promise<Idea[]> {
  const count = Math.min(8, Math.max(3, input.count ?? 6));
  if (!isAIEnabled()) return stubBatch(input, count);

  const user = await UserModel.findById(input.userId).select('skills role headline').lean();
  const kinds = input.kinds?.length ? input.kinds : [...PROJECT_KINDS];

  const prompt = `
USER
- Role: ${user?.role}
- Headline: ${user?.headline ?? '—'}
- Skills: ${(user?.skills as string[] | undefined)?.join(', ') ?? '—'}
- Career goal: ${input.goal ?? '—'}

Generate ${count} project ideas across these kinds (mix freely): ${kinds.join(', ')}.

For each idea, return JSON matching:
{ ideas: [{
  kind: ${kinds.map((k) => `"${k}"`).join(' | ')},
  title: string,
  summary: string,          // 1–2 sentences
  why: string,              // 1 sentence — why it boosts their career
  stack: string[],          // 3–8 specific technologies
  skills: string[],         // 3–6 skills to learn
  difficulty: "easy"|"medium"|"hard"|"extreme",
  estimatedWeeks: number,
  deliverables: string[],   // 2–5 concrete artifacts
  nextSteps: string[]       // 3–5 first-week actions
}]}
`.trim();

  try {
    const client = openai()!;
    const r = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt }
      ]
    });
    const parsed = BatchZ.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
    return parsed.ideas.map((i) => ({ ...i }));
  } catch (e) {
    logger.error(e, 'project ideas generation failed');
    return stubBatch(input, count);
  }
}

export function toneOf(kind: ProjectKind): string { return TONES[kind]; }

/* ─── Deterministic fallback so the page still works without an API key ─── */
function stubBatch(input: { goal?: string; kinds?: ProjectKind[] }, count: number): Idea[] {
  const ideas: Idea[] = [
    {
      kind: 'portfolio',
      title: 'A multiplayer whiteboard with conflict-free sync',
      summary: 'Real-time canvas where users draw shapes, cursors and chat — built on CRDTs.',
      why: 'Demonstrates systems-design depth that wins senior interviews.',
      stack: ['Next.js', 'WebSockets', 'Yjs', 'TypeScript', 'Tailwind'],
      skills: ['CRDTs', 'Real-time', 'State management'],
      difficulty: 'hard',
      estimatedWeeks: 4,
      deliverables: ['Public deploy', 'Open-source repo', 'Architecture write-up'],
      nextSteps: ['Sketch data model', 'Spike Yjs awareness', 'Decide persistence layer']
    },
    {
      kind: 'github',
      title: 'A typesafe REST client codegen from OpenAPI',
      summary: 'Generate fully-typed fetch clients with React Query bindings from any OpenAPI 3 spec.',
      why: 'Tooling repos with real DX wins get noticed by recruiters.',
      stack: ['TypeScript', 'ts-morph', 'pnpm', 'Vitest'],
      skills: ['Code generation', 'Type-level programming', 'CLI'],
      difficulty: 'medium',
      estimatedWeeks: 3,
      deliverables: ['npm package', '100+ stars target', 'Demo Next.js app'],
      nextSteps: ['Pick spec format', 'Sketch CLI', 'Define type-output strategy']
    },
    {
      kind: 'startup',
      title: 'AI study buddy for engineering students',
      summary: 'Personalized study plan + interactive flashcards + group sessions built on your university materials.',
      why: 'Validates AI-product instincts in a hot education-tech market.',
      stack: ['Next.js', 'OpenAI', 'Postgres', 'Stripe'],
      skills: ['Product design', 'Onboarding', 'LLM integration'],
      difficulty: 'hard',
      estimatedWeeks: 6,
      deliverables: ['Landing page', 'MVP signup flow', '10 user interviews'],
      nextSteps: ['Talk to 5 students', 'Sketch onboarding', 'Pick course as wedge']
    },
    {
      kind: 'challenge',
      title: 'Build a tiny git from scratch in 1 week',
      summary: 'Implement add, commit, log and diff with content-addressed storage.',
      why: 'Famous portfolio piece for proving systems intuition.',
      stack: ['Node.js', 'TypeScript', 'fs/crypto'],
      skills: ['Data structures', 'Hashing', 'CLI'],
      difficulty: 'medium',
      estimatedWeeks: 1,
      deliverables: ['Working CLI', 'README walkthrough'],
      nextSteps: ['Read git internals chapter', 'Stub init/add', 'Design object store']
    },
    {
      kind: 'realworld',
      title: 'Open the algerian university job board',
      summary: 'Aggregate every public engineering scholarship + lab opportunity into one searchable feed.',
      why: 'Real impact + community traction + immediate portfolio signal.',
      stack: ['Next.js', 'MongoDB', 'Playwright', 'TanStack Query'],
      skills: ['Scraping', 'Data pipelines', 'Community building'],
      difficulty: 'medium',
      estimatedWeeks: 3,
      deliverables: ['Live site', 'Daily refreshed listings', 'Open-source scraper'],
      nextSteps: ['List target universities', 'Spike a single scraper', 'Pick storage']
    },
    {
      kind: 'portfolio',
      title: 'A theme-aware design tokens playground',
      summary: 'Live editor for color/space/type tokens that exports CSS/Tailwind/JSON.',
      why: 'Design-engineering crossover is the highest-paying lane in 2026.',
      stack: ['React', 'OKLCH', 'Tailwind', 'Vite'],
      skills: ['Design systems', 'Color theory', 'Tokens'],
      difficulty: 'medium',
      estimatedWeeks: 2,
      deliverables: ['Public deploy', 'Export formats', 'Demo themes'],
      nextSteps: ['Model token graph', 'Pick export targets', 'Sketch playground UI']
    }
  ];
  const filtered = input.kinds?.length
    ? ideas.filter((i) => input.kinds!.includes(i.kind))
    : ideas;
  return filtered.slice(0, count);
}
