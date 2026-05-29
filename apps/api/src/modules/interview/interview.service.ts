import { z } from 'zod';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { logger } from '../../config/logger';
import { UserModel } from '../auth/auth.model';
import type { InterviewCategory, InterviewLevel } from './interview.model';

export interface StartContext {
  userId: string;
  category: InterviewCategory;
  level: InterviewLevel;
  jobTitle?: string;
}

const QuestionSchema = z.object({
  question: z.string(),
  kind: z.enum(['open', 'technical', 'behavioral']).default('open')
});

const FeedbackSchema = z.object({
  confidence: z.number().min(0).max(100),
  vocabulary: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  coach: z.string()
});

const FinalSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).max(6),
  weaknesses: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(8)
});

export type Question = z.infer<typeof QuestionSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type FinalReport = z.infer<typeof FinalSchema>;

const SYSTEM_INTERVIEWER = (category: InterviewCategory, level: InterviewLevel, title: string, skills: string[]) => `
You are WORK AI, a friendly but rigorous interviewer.

ROLE: Run a ${level}-level mock interview for "${title}" in the "${category}" track.
USER SKILLS (use to tailor depth, but don't quiz only on these): ${skills.join(', ') || '—'}

STYLE:
- One question at a time. Concise. Realistic. ${category === 'hr' ? 'Behavioral.' : ''}
- For technical tracks, mix open + technical + behavioral.
- Never reveal scoring rubric to the user.
- Respond ONLY with strict JSON.
`.trim();

const SCORING_SYSTEM = `
You are WORK AI's answer evaluator. Score the candidate's answer on 5 dimensions
(0–100 each) and provide a short coach note (under 50 words).
Be honest, specific, kind. Output ONLY JSON.
`.trim();

const FINAL_SYSTEM = `
You write final mock-interview reports. Be ruthlessly honest, but constructive.
Aggregate per-turn feedback into a final score (0–100), 2–4 strengths, 2–4 weaknesses,
and 4–8 concrete improvements. Output ONLY JSON.
`.trim();

export const interviewService = {
  async startQuestions(ctx: StartContext, total: number): Promise<{ skillsContext: string[]; first: Question }> {
    const user = await UserModel.findById(ctx.userId).select('skills headline name role').lean();
    const skills: string[] = (user?.skills as string[]) ?? [];
    const first = await this.nextQuestion({ ...ctx, skills, previous: [] });
    return { skillsContext: skills, first };
  },

  async nextQuestion(opts: {
    category: InterviewCategory; level: InterviewLevel; jobTitle?: string;
    skills: string[]; previous: { question: string; answer?: string }[];
  }): Promise<Question> {
    if (!isAIEnabled()) return stubQuestion(opts);

    const client = openai()!;
    const sys = SYSTEM_INTERVIEWER(opts.category, opts.level, opts.jobTitle ?? defaultTitle(opts.category), opts.skills);
    const user = `
Previous turns:
${opts.previous.map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer ?? '(no answer)'}`).join('\n\n')}

Ask the next ${opts.previous.length === 0 ? 'opening' : 'follow-up'} question.
Return JSON: { "question": string, "kind": "open" | "technical" | "behavioral" }
`.trim();

    try {
      const r = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.6,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
      });
      return QuestionSchema.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
    } catch (e) {
      logger.error(e, 'interview question gen failed');
      return stubQuestion(opts);
    }
  },

  async scoreAnswer(opts: {
    category: InterviewCategory; level: InterviewLevel; jobTitle?: string;
    question: string; answer: string;
  }): Promise<Feedback> {
    if (!isAIEnabled() || !opts.answer.trim()) return stubFeedback(opts.answer);

    const client = openai()!;
    const prompt = `
TRACK: ${opts.category} · LEVEL: ${opts.level} · ROLE: ${opts.jobTitle ?? defaultTitle(opts.category)}
QUESTION: ${opts.question}
ANSWER: """${opts.answer.slice(0, 4000)}"""

Score this answer. Return JSON:
{ confidence, vocabulary, technical, communication, clarity, overall: 0-100, coach: string }
`.trim();
    try {
      const r = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        messages: [{ role: 'system', content: SCORING_SYSTEM }, { role: 'user', content: prompt }]
      });
      return FeedbackSchema.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
    } catch (e) {
      logger.error(e, 'answer scoring failed');
      return stubFeedback(opts.answer);
    }
  },

  async finalize(opts: {
    category: InterviewCategory; level: InterviewLevel; jobTitle?: string;
    turns: { question: string; answer?: string; feedback?: Feedback }[];
  }): Promise<FinalReport> {
    if (!isAIEnabled()) return stubFinal(opts.turns);

    const client = openai()!;
    const prompt = `
TRACK: ${opts.category} · LEVEL: ${opts.level}
TURNS (with per-turn feedback):
${opts.turns.map((t, i) =>
  `Q${i + 1}: ${t.question}\nA: ${t.answer ?? '(skipped)'}\nScore: ${t.feedback?.overall ?? '—'} · ${t.feedback?.coach ?? ''}`
).join('\n\n')}

Generate the final report. JSON:
{ score, summary, strengths: string[], weaknesses: string[], improvements: string[] }
`.trim();
    try {
      const r = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [{ role: 'system', content: FINAL_SYSTEM }, { role: 'user', content: prompt }]
      });
      return FinalSchema.parse(JSON.parse(r.choices[0]?.message?.content ?? '{}'));
    } catch (e) {
      logger.error(e, 'final report failed');
      return stubFinal(opts.turns);
    }
  }
};

/* ─── Deterministic fallbacks ─── */

function defaultTitle(c: InterviewCategory): string {
  return ({
    frontend: 'Senior Frontend Engineer',
    backend: 'Senior Backend Engineer',
    design: 'Senior Product Designer',
    hr: 'Product Manager',
    marketing: 'Growth Marketing Lead',
    communication: 'Customer Success Manager'
  } as const)[c];
}

function stubQuestion(opts: { category: InterviewCategory; level: InterviewLevel; previous: { question: string }[] }): Question {
  const bank: Record<InterviewCategory, { question: string; kind: 'open' | 'technical' | 'behavioral' }[]> = {
    frontend: [
      { question: 'Walk me through a recent frontend project you shipped and the trade-offs you made.', kind: 'behavioral' },
      { question: 'How would you measure and improve LCP on a content-heavy page?', kind: 'technical' },
      { question: 'Explain hydration vs server components in a framework you know.', kind: 'technical' },
      { question: 'Describe a time you debugged a tricky CSS layout issue.', kind: 'behavioral' },
      { question: 'How do you design a reusable design-system component?', kind: 'open' },
      { question: 'How would you architect a real-time collaborative cursor system?', kind: 'technical' }
    ],
    backend: [
      { question: 'Walk me through your last system you scaled — what broke first?', kind: 'behavioral' },
      { question: 'Design a rate-limiter for an API with 100k RPS.', kind: 'technical' },
      { question: 'How would you choose between SQL and a document store for a social feed?', kind: 'technical' },
      { question: 'Tell me about a production incident you led.', kind: 'behavioral' },
      { question: 'Explain idempotency in payment APIs.', kind: 'technical' },
      { question: 'When would you reach for an event-driven architecture?', kind: 'open' }
    ],
    design: [
      { question: 'Walk me through a product you redesigned. What was the impact?', kind: 'behavioral' },
      { question: 'How do you decide when to break a design system rule?', kind: 'open' },
      { question: 'A stakeholder hates your design. How do you respond?', kind: 'behavioral' },
      { question: 'How do you validate a design before engineering kicks off?', kind: 'open' },
      { question: 'How do you balance accessibility and visual ambition?', kind: 'open' },
      { question: 'Tell me about a metric you moved with a design change.', kind: 'behavioral' }
    ],
    hr: [
      { question: 'Tell me about a time you resolved a conflict in your team.', kind: 'behavioral' },
      { question: 'Describe your biggest professional mistake.', kind: 'behavioral' },
      { question: 'Why are you leaving your current role?', kind: 'behavioral' },
      { question: 'Where do you see yourself in 3 years?', kind: 'open' },
      { question: 'Tell me about a time you disagreed with your manager.', kind: 'behavioral' },
      { question: 'What energises you about your work?', kind: 'open' }
    ],
    marketing: [
      { question: 'Walk me through a growth experiment that worked.', kind: 'behavioral' },
      { question: 'How do you allocate a $50k acquisition budget across channels?', kind: 'technical' },
      { question: 'What metric is most overrated in marketing?', kind: 'open' },
      { question: 'Describe how you built a brand from scratch.', kind: 'behavioral' },
      { question: 'How do you align with product on roadmap?', kind: 'open' },
      { question: 'Tell me about a campaign that failed.', kind: 'behavioral' }
    ],
    communication: [
      { question: 'Tell me about an angry customer you turned around.', kind: 'behavioral' },
      { question: 'How do you say "no" to a big customer?', kind: 'open' },
      { question: 'Walk me through how you escalate internally.', kind: 'open' },
      { question: 'Describe a time you taught yourself a new product fast.', kind: 'behavioral' },
      { question: 'How do you maintain empathy at scale?', kind: 'open' },
      { question: 'A bug is hurting a top customer. What do you say first?', kind: 'behavioral' }
    ]
  };
  const list = bank[opts.category];
  const idx = Math.min(list.length - 1, opts.previous.length);
  return list[idx];
}

function stubFeedback(answer: string): Feedback {
  const len = answer.trim().split(/\s+/).filter(Boolean).length;
  const base = Math.min(85, 35 + Math.floor(len / 4));
  return {
    confidence: base + 5, vocabulary: base, technical: base - 4,
    communication: base + 2, clarity: base, overall: base,
    coach: len < 30
      ? 'Answer was very short. Use STAR (Situation, Task, Action, Result) to add structure.'
      : 'Solid answer. Add one measurable outcome and you push into senior territory.'
  };
}

function stubFinal(turns: { feedback?: Feedback; answer?: string }[]): FinalReport {
  const scored = turns.filter((t) => t.feedback);
  const avg = scored.length
    ? Math.round(scored.reduce((s, t) => s + (t.feedback?.overall ?? 0), 0) / scored.length)
    : 50;
  return {
    score: avg,
    summary: avg >= 75 ? 'Strong showing. Top-of-funnel material.' : avg >= 55 ? 'Solid foundation, room to sharpen impact.' : 'Needs more reps. Structure and specifics will lift you fast.',
    strengths: ['Clear narrative arcs', 'Calm under technical pressure'],
    weaknesses: ['Outcomes rarely quantified', 'Tangents in long answers'],
    improvements: [
      'Apply STAR to every behavioral answer.',
      'End each story with a metric (%, $, time).',
      'Cap answers at 90 seconds, then check in.',
      'Practice 3 system-design openers cold.'
    ]
  };
}
