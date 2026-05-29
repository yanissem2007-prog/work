import { z } from 'zod';
import { openai, MODEL, isAIEnabled } from '../ai/services/openai';
import { logger } from '../../config/logger';
import type { Heuristics } from './heuristics';

const Breakdown = z.object({
  structure: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  ats: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  technologies: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  portfolio: z.number().min(0).max(100)
});

const Report = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  breakdown: Breakdown,
  weaknesses: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high']),
    title: z.string(),
    detail: z.string()
  })).max(8),
  suggestions: z.object({
    titles: z.array(z.string()).max(5),
    summary: z.string(),
    bullets: z.array(z.string()).max(6),
    portfolio: z.array(z.string()).max(5)
  }),
  recommendations: z.object({
    missingSkills: z.array(z.string()).max(10),
    certifications: z.array(z.string()).max(6),
    courses: z.array(z.string()).max(6),
    targetRoles: z.array(z.string()).max(6)
  }),
  detectedSkills: z.array(z.string()).max(40)
});

export type AnalysisReport = z.infer<typeof Report>;

const SYSTEM = `
You are WORK AI's CV Score engine. You read raw CV text and output a strict JSON
report scoring the CV on a 0–100 scale across 7 dimensions, plus weaknesses,
specific rewrite suggestions, and skill/certification/course recommendations.

GROUND RULES
- Be ruthlessly honest, but kind. Aim for actionable, specific feedback.
- Quantify suggestions where you can. Suggest impact metrics.
- Detect technologies and skills mentioned; surface what's missing for the target role.
- ATS score reflects: parsable headings, no graphics-only text, consistent dates,
  reasonable keyword density.
- Output ONLY valid JSON. No prose.
`.trim();

export async function analyzeCv(text: string, h: Heuristics): Promise<AnalysisReport> {
  if (!isAIEnabled()) return stubReport(text, h);

  const client = openai()!;
  const prompt = `
HEURISTICS (anchors, treat as priors not absolutes):
${JSON.stringify(h, null, 2)}

CV TEXT (truncated to 12 KB):
"""
${text.slice(0, 12_000)}
"""

Return JSON matching this TypeScript type:
{
  score: number;
  summary: string;
  breakdown: { structure, readability, ats, grammar, technologies, experience, portfolio: number };
  weaknesses: { severity: 'low'|'medium'|'high'; title: string; detail: string }[];
  suggestions: { titles: string[]; summary: string; bullets: string[]; portfolio: string[] };
  recommendations: { missingSkills: string[]; certifications: string[]; courses: string[]; targetRoles: string[] };
  detectedSkills: string[];
}
`.trim();

  try {
    const r = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt }
      ]
    });
    const content = r.choices[0]?.message?.content ?? '{}';
    const parsed = Report.parse(JSON.parse(content));
    return parsed;
  } catch (e) {
    logger.error(e, 'CV analyzer LLM failure — falling back to stub');
    return stubReport(text, h);
  }
}

/* ─── Stub (deterministic) ─── */
function stubReport(text: string, h: Heuristics): AnalysisReport {
  const detected = uniqueLower([
    ...text.match(/\b(TypeScript|JavaScript|React|Next\.js|Node\.js|Python|Go|Rust|Swift|Kotlin|Figma|AWS|Docker|Kubernetes|PostgreSQL|MongoDB|GraphQL|Tailwind|PyTorch)\b/gi) ?? []
  ]);
  const score = (() => {
    let s = 50;
    s += Math.min(h.sectionsFound.length * 4, 16);
    s += [h.contacts.email, h.contacts.phone, h.contacts.linkedin, h.contacts.github].filter(Boolean).length * 2;
    s += Math.min(h.quantifierCount * 1.2, 12);
    s += Math.min(h.actionVerbCount, 8);
    s -= Math.min(h.weakPhraseCount * 2, 12);
    return Math.max(0, Math.min(100, Math.round(s)));
  })();

  return {
    score,
    summary:
      score >= 80 ? 'Strong CV. Quantified results, clear structure, and parsable formatting put you ahead of most applicants.'
        : score >= 60 ? 'Solid foundation. A few measurable outcomes and stronger verbs would push this into the top tier.'
          : 'Rough draft — restructure for impact and quantify your wins to compete at top companies.',
    breakdown: {
      structure: Math.min(100, 40 + h.sectionsFound.length * 9),
      readability: h.signals.readableSentenceLength > 0 && h.signals.readableSentenceLength <= 24 ? 78 : 58,
      ats: 60 + (h.contacts.email ? 8 : 0) + (h.sectionsFound.length >= 4 ? 12 : 0),
      grammar: 72 - Math.min(h.weakPhraseCount * 4, 20),
      technologies: Math.min(100, 35 + detected.length * 4),
      experience: Math.min(100, 40 + h.actionVerbCount * 4 + h.quantifierCount * 2),
      portfolio: h.contacts.github || h.contacts.linkedin ? 70 : 35
    },
    weaknesses: [
      ...(h.weakPhraseCount > 0 ? [{ severity: 'high' as const, title: 'Weak phrasing detected', detail: `Phrases like "responsible for" appear ${h.weakPhraseCount}× — replace with action-led verbs.` }] : []),
      ...(h.quantifierCount < 3 ? [{ severity: 'high' as const, title: 'Not enough numbers', detail: 'Strong CVs quantify outcomes. Aim for 3–5 measurable wins (%, $, time saved).' }] : []),
      ...(!h.contacts.linkedin ? [{ severity: 'medium' as const, title: 'No LinkedIn link', detail: 'Add a LinkedIn URL — recruiters expect it within reach.' }] : []),
      ...(!h.contacts.github && detected.length > 4 ? [{ severity: 'medium' as const, title: 'No GitHub link', detail: 'For technical roles, a public GitHub or portfolio dramatically increases callbacks.' }] : []),
      ...(h.signals.readableSentenceLength > 28 ? [{ severity: 'low' as const, title: 'Long sentences', detail: 'Average sentence length is high. Shorter sentences read faster on recruiter scans.' }] : [])
    ],
    suggestions: {
      titles: ['Senior Product Engineer', 'Staff Software Engineer', 'Full-stack Tech Lead'],
      summary: 'Senior engineer with 5+ years building consumer products. Shipped revenue-driving features at scale; mentored teams of 4–6.',
      bullets: [
        'Led migration to Next.js App Router, cutting LCP 38% and engineering build times 62%.',
        'Shipped onboarding redesign — increased activation +24% (1.2M MAU).',
        'Mentored 4 mid-level engineers; 2 promoted within 12 months.'
      ],
      portfolio: ['Open-source UI library used by 5k+ devs', 'Side project: a job-matching AI that hit 12k signups in 2 weeks']
    },
    recommendations: {
      missingSkills: ['System design', 'Performance profiling', 'A/B testing', 'Accessibility (WCAG 2.2)'],
      certifications: ['AWS Solutions Architect', 'Google UX Design', 'Scrum.org PSM I'],
      courses: ['Frontend Masters · Web Performance', 'MIT 6.824 · Distributed Systems'],
      targetRoles: ['Senior Frontend Engineer', 'Staff Engineer', 'Tech Lead']
    },
    detectedSkills: detected
  };
}

function uniqueLower(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(s); }
  }
  return out;
}
