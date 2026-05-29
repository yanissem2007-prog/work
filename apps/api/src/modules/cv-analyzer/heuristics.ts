/**
 * Cheap, deterministic signals to anchor the AI score and provide a fallback
 * when no API key is configured. Pure functions, no I/O.
 */

const ACTION_VERBS = ['led', 'built', 'shipped', 'scaled', 'launched', 'drove', 'reduced', 'increased', 'cut', 'designed', 'architected', 'mentored', 'owned', 'delivered'];
const QUANTIFIERS = /(\d+\s?%|\d+(\.\d+)?[mkb]|\$\s?\d|\bx[0-9]+\b)/gi;
const WEAK_WORDS = ['responsible for', 'worked on', 'helped', 'assisted', 'duties included'];
const CONTACT = {
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/,
  phone: /(\+?\d[\d\s\-().]{6,}\d)/,
  linkedin: /linkedin\.com\/[^\s)]+/i,
  github: /github\.com\/[^\s)]+/i
};
const SECTIONS = ['experience', 'education', 'skills', 'projects', 'summary', 'about'];

export interface Heuristics {
  wordCount: number;
  actionVerbCount: number;
  quantifierCount: number;
  weakPhraseCount: number;
  contacts: { email: boolean; phone: boolean; linkedin: boolean; github: boolean };
  sectionsFound: string[];
  signals: { readableSentenceLength: number };
}

export function computeHeuristics(text: string): Heuristics {
  const lower = text.toLowerCase();
  const tokens = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.length > 5);
  const avgSentence = sentences.length
    ? Math.round(tokens.length / sentences.length)
    : 0;
  return {
    wordCount: tokens.length,
    actionVerbCount: ACTION_VERBS.reduce((n, v) => n + (lower.split(v).length - 1), 0),
    quantifierCount: (text.match(QUANTIFIERS) ?? []).length,
    weakPhraseCount: WEAK_WORDS.reduce((n, w) => n + (lower.split(w).length - 1), 0),
    contacts: {
      email: CONTACT.email.test(text),
      phone: CONTACT.phone.test(text),
      linkedin: CONTACT.linkedin.test(text),
      github: CONTACT.github.test(text)
    },
    sectionsFound: SECTIONS.filter((s) => lower.includes(s)),
    signals: { readableSentenceLength: avgSentence }
  };
}

/** 0–100 baseline computed from heuristics. AI may override. */
export function baselineScore(h: Heuristics): number {
  let score = 50;
  // structure
  score += Math.min(h.sectionsFound.length * 4, 16); // 0–16
  // contacts
  score += [h.contacts.email, h.contacts.phone, h.contacts.linkedin, h.contacts.github].filter(Boolean).length * 2; // 0–8
  // measurable outcomes
  score += Math.min(h.quantifierCount * 1.2, 12); // 0–12
  // action verbs
  score += Math.min(h.actionVerbCount, 8); // 0–8
  // penalize weak phrasing
  score -= Math.min(h.weakPhraseCount * 2, 12);
  // readability sweet spot
  if (h.signals.readableSentenceLength >= 8 && h.signals.readableSentenceLength <= 22) score += 4;
  else score -= 2;
  // length
  if (h.wordCount < 200) score -= 12;
  else if (h.wordCount > 1500) score -= 6;
  return Math.max(0, Math.min(100, Math.round(score)));
}
