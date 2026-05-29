import crypto from 'crypto';
import { z } from 'zod';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { logger } from '../../config/logger';
import { UserModel } from '../auth/auth.model';
import type { CoachFocus } from './coach.model';

const PlanZ = z.object({
  summary: z.string(),
  plan: z.array(z.object({
    title: z.string(),
    action: z.string().optional(),
    weekOffset: z.number().int().min(0).max(52).default(1)
  })).min(3).max(10),
  insights: z.array(z.string()).max(5)
});

export type CoachPlan = z.infer<typeof PlanZ>;

const FOCUS_PROMPT: Record<CoachFocus, string> = {
  career: 'Career improvement: positioning, role progression, comp negotiation, network strategy.',
  learning: 'Learning plan: skills to build, resources, sequencing, weekly cadence.',
  profile: 'Profile optimization: CV, LinkedIn-style headline, projects, signal density.',
  tech: 'Technology choice: which stack/role to commit to and why, given market + user fit.',
  interview: 'Interview prep: company target list, mock sessions, story bank, follow-ups.'
};

const SYSTEM = `
You are WORK AI, an executive-level career coach.
Tone: direct, specific, kind. No fluff.
Output strict JSON only.
Every plan step must be measurable and finishable in 1–4 weeks.
`.trim();

export async function generatePlan(input: {
  userId: string; focus: CoachFocus; goal: string; horizonWeeks: number;
}): Promise<CoachPlan> {
  if (!isAIEnabled()) return stub(input);

  const user = await UserModel.findById(input.userId)
    .select('name role headline skills location').lean();

  const prompt = `
FOCUS: ${FOCUS_PROMPT[input.focus]}
GOAL: "${input.goal}"
HORIZON: ${input.horizonWeeks} weeks

USER
- Name: ${user?.name}
- Role: ${user?.role}
- Headline: ${user?.headline ?? '—'}
- Skills: ${(user?.skills as string[] | undefined)?.join(', ') ?? '—'}

Return JSON:
{
  "summary": string,                   // 2 sentences, framing the path
  "plan": [{                           // 3–10 steps
    "title": string,
    "action": string,                  // one concrete weekly action
    "weekOffset": number               // weeks from now this step is due
  }],
  "insights": string[]                 // 2–5 punchy advisory bullets
}
`.trim();

  try {
    const client = openai()!;
    const r = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.55,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt }
      ]
    });
    return PlanZ.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
  } catch (e) {
    logger.error(e, 'coach plan generation failed');
    return stub(input);
  }
}

export async function generateCheckInInsight(input: {
  goal: string; focus: CoachFocus;
  recent: { mood?: string; win?: string; block?: string; next?: string };
}): Promise<string> {
  if (!isAIEnabled()) return defaultInsight(input.recent);
  try {
    const client = openai()!;
    const r = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 220,
      messages: [
        { role: 'system', content: 'You are a kind, sharp career coach. Reply in 2 sentences max. No bullet points.' },
        { role: 'user', content:
`Goal (${input.focus}): ${input.goal}
Mood: ${input.recent.mood ?? '—'}
Win this week: ${input.recent.win ?? '—'}
What blocked you: ${input.recent.block ?? '—'}
Next step planned: ${input.recent.next ?? '—'}

Give one specific actionable insight + one sentence of encouragement.` }
      ]
    });
    return r.choices[0]?.message?.content?.trim() ?? defaultInsight(input.recent);
  } catch (e) {
    logger.error(e, 'check-in insight failed');
    return defaultInsight(input.recent);
  }
}

/* ─── Helpers ─── */

function stub(input: { focus: CoachFocus; goal: string; horizonWeeks: number }): CoachPlan {
  return {
    summary: `Twelve-week plan tuned to your "${input.goal}" goal. We'll prioritize visible output over passive learning.`,
    plan: [
      { title: 'Pick 2 dream companies', action: 'Research their stack, recent launches, and write a 1-pager pitch.', weekOffset: 1 },
      { title: 'Ship one portfolio artifact', action: 'A small but production-grade project that maps to your target role.', weekOffset: 3 },
      { title: 'Run 3 mock interviews', action: 'Use /interview, target the kind of questions your dream companies ask.', weekOffset: 5 },
      { title: 'Network with 5 hires', action: 'DM 5 people who got the role you want in the last 12 months.', weekOffset: 6 },
      { title: 'Rewrite your CV with /cv-analyzer', action: 'Get to 85+ on the WORK Score before applying.', weekOffset: 8 },
      { title: 'Apply to 10 roles', action: 'Personalized cover, referrer when possible.', weekOffset: 10 },
      { title: 'Decision week', action: 'Decline what is wrong; negotiate what is right.', weekOffset: 12 }
    ],
    insights: [
      'Output beats input. One shipped project trumps three tutorials.',
      'Visibility compounds. Post one weekly artifact.',
      'Networks pay later. Plant seeds before you need them.'
    ]
  };
}

function defaultInsight(r: { mood?: string; block?: string; next?: string }): string {
  if (r.block) return `Name the smallest version of "${r.block}" you can clear in 30 minutes today. Then do it. Momentum from a tiny win unlocks the rest.`;
  if (r.mood === 'great') return `Lean into this momentum. Stack another ship this week — Future You will thank Today You.`;
  return `Pick one concrete next step you can finish in under an hour. Done > perfect.`;
}

export function nextDueAt(weekOffset: number, base = new Date()): Date {
  return new Date(base.getTime() + weekOffset * 7 * 86_400_000);
}

export function addIds(plan: CoachPlan): CoachPlan & { plan: Array<CoachPlan['plan'][number] & { id: string; due: Date; done: boolean }> } {
  const now = new Date();
  return {
    ...plan,
    plan: plan.plan.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      due: nextDueAt(s.weekOffset, now),
      done: false
    }))
  };
}
