import { UserModel } from '../../auth/auth.model';

/**
 * Built-in career assistant used when no OpenAI key is configured.
 * It detects intent, pulls real data via the existing tool layer, and returns
 * a plan that streamChat turns into a streamed reply + a rich tool card.
 * Fully functional with zero external dependencies; the real LLM path takes
 * over automatically once OPENAI_API_KEY is set.
 */
export interface LocalPlan {
  intro: string;
  tool?: { name: string; args: Record<string, unknown> };
  closing?: string;
}

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));

export async function planLocalReply(message: string, userId: string, locale = 'en'): Promise<LocalPlan> {
  const m = message.toLowerCase();
  const fr = locale.toLowerCase().startsWith('fr');
  const t = (en: string, frx: string) => (fr ? frx : en);

  const user = await UserModel.findById(userId).select('name role headline skills').lean();
  const firstName = user?.name?.split(' ')[0] ?? '';
  const role = (user?.headline || user?.role || 'professional') as string;

  // ── Job matching ──
  if (has(m, 'job', 'jobs', 'offre', 'emploi', 'poste', 'hiring', 'recrut', 'match', 'recommend', 'recommand', 'remote', 'télétravail', 'opportun')) {
    const remote = has(m, 'remote', 'télétravail', 'distanciel');
    const sal = m.match(/(\d{2,3})\s?k|\$?\s?(\d{2,3})[\s,]?000/);
    const minSalary = sal ? Number(sal[1] ?? sal[2]) * 1000 : undefined;
    return {
      intro: t(
        `Here are live roles matched to your profile${remote ? ' (remote only)' : ''}:`,
        `Voici des offres en direct correspondant à ton profil${remote ? ' (télétravail uniquement)' : ''} :`
      ),
      tool: { name: 'recommendJobs', args: { remote: remote || undefined, minSalary, limit: 5 } },
      closing: t(
        'Tap any role to view it and apply. Want me to filter by remote or a salary floor?',
        'Clique sur une offre pour la voir et postuler. Je filtre par télétravail ou salaire minimum ?'
      )
    };
  }

  // ── CV / resume ──
  if (has(m, 'cv', 'resume', 'résumé', 'bullet', 'experience', 'expérience')) {
    return {
      intro: t(
        "Here's how I'd sharpen that into measurable, recruiter-ready bullets:",
        'Voici comment transformer ça en lignes mesurables, prêtes pour les recruteurs :'
      ),
      tool: { name: 'improveCvBullets', args: { draft: message, role } },
      closing: t(
        'Swap the bracketed values for your real numbers. Want me to tailor these to a specific job?',
        'Remplace les valeurs entre crochets par tes vrais chiffres. Je les adapte à une offre précise ?'
      )
    };
  }

  // ── Interview practice ──
  if (has(m, 'interview', 'entretien', 'mock', 'practice', 'practise')) {
    const kind = has(m, 'system', 'système', 'design') ? 'system-design'
      : has(m, 'technical', 'technique', 'coding', 'algo') ? 'technical'
      : has(m, 'product', 'produit') ? 'product' : 'behavioral';
    const roleMatch = message.match(/(?:for an?|pour un[e]?|as an?)\s+([^.?!]+)/i);
    return {
      intro: t(
        "Let's practice. Here's a realistic question — take your time:",
        "On s'entraîne. Voici une question réaliste — prends ton temps :"
      ),
      tool: { name: 'interviewQuestion', args: { role: roleMatch?.[1]?.trim() || role, kind } },
      closing: t(
        "Reply with your answer and I'll give feedback against the rubric.",
        'Réponds avec ta réponse et je te ferai un retour selon la grille.'
      )
    };
  }

  // ── Skills suggestions ──
  if (has(m, 'skill', 'compétence', 'competence', 'learn', 'apprendre', 'study', 'étudier')) {
    const roleMatch = message.match(/(?:for|to be|become|pour|devenir)\s+(?:an?\s+)?([^.?!]+)/i);
    return {
      intro: t(
        'Based on that target, here are high-leverage skills worth adding:',
        'Pour ce poste visé, voici les compétences à fort impact à ajouter :'
      ),
      tool: { name: 'suggestSkills', args: { targetRole: roleMatch?.[1]?.trim() || role } },
      closing: t(
        'Add these to your profile to unlock more matches. Want a learning roadmap for one?',
        "Ajoute-les à ton profil pour débloquer plus de matchs. Tu veux une roadmap d'apprentissage ?"
      )
    };
  }

  // ── Profile snapshot ──
  if (has(m, 'my profile', 'mon profil', 'who am i', 'about me', 'qui suis')) {
    return {
      intro: t("Here's your current snapshot on WORK:", 'Voici ton profil actuel sur WORK :'),
      tool: { name: 'getMyProfile', args: {} },
      closing: t('Want me to suggest improvements or matching jobs?', 'Je te suggère des améliorations ou des offres ?')
    };
  }

  // ── Salary negotiation ──
  if (has(m, 'salary', 'salaire', 'negotiat', 'négoci', 'offer', 'rémunér', 'raise', 'augmentation')) {
    return {
      intro: t(
        `Salary negotiation — a quick framework:\n\n1. Anchor high but credible — research the band, then ask for the top third.\n2. Avoid naming the first number when you can.\n3. Negotiate the whole package: base, equity, sign-on, remote, learning budget.\n4. Use a competing offer as honest leverage.\n5. Get it in writing before you accept.\n\nScript: "I'm excited about the role. Based on my experience and market data, I was expecting a base around [X]. Can we get there?"\n\nTell me the role and number and I'll tailor the script.`,
        `Négociation salariale — méthode rapide :\n\n1. Ancre haut mais crédible — étudie la fourchette, vise le tiers supérieur.\n2. Évite de donner le premier chiffre.\n3. Négocie tout le package : fixe, equity, prime d'arrivée, télétravail, budget formation.\n4. Utilise une offre concurrente comme levier, honnêtement.\n5. Obtiens-le par écrit avant d'accepter.\n\nScript : « Le poste m'enthousiasme. Vu mon expérience et le marché, je visais un fixe autour de [X]. On peut s'en approcher ? »\n\nDonne-moi le poste et le montant, je personnalise le script.`
      )
    };
  }

  // ── Roadmap / career transition ──
  if (has(m, 'roadmap', 'path', 'devenir', 'become', 'transition', 'career change', 'reconvers', 'plan de carrière')) {
    const roleMatch = message.match(/(?:become|be an?|devenir|vers)\s+(?:an?\s+)?([^.?!]+)/i);
    const target = roleMatch?.[1]?.trim() || role;
    return {
      intro: t(
        `A pragmatic 90-day roadmap toward ${target}:\n\n• Weeks 1–3: master the fundamentals + ship one small project.\n• Weeks 4–7: build a portfolio piece that mirrors the real job.\n• Weeks 8–10: contribute publicly (open source, posts) to build proof.\n• Weeks 11–13: apply with a tailored CV + practice interviews here.\n\nSkills to prioritise:`,
        `Une roadmap pragmatique sur 90 jours vers ${target} :\n\n• Semaines 1–3 : maîtrise les fondamentaux + livre un petit projet.\n• Semaines 4–7 : construis une pièce de portfolio proche du vrai job.\n• Semaines 8–10 : contribue publiquement (open source, posts) pour prouver.\n• Semaines 11–13 : postule avec un CV ciblé + entraîne-toi aux entretiens ici.\n\nCompétences à prioriser :`
      ),
      tool: { name: 'suggestSkills', args: { targetRole: target } },
      closing: t(
        'Open the Roadmap tab to generate a detailed week-by-week plan.',
        "Ouvre l'onglet Roadmap pour générer un plan détaillé semaine par semaine."
      )
    };
  }

  // ── Greeting / capabilities (after specific intents so "help me with X" routes to X) ──
  if (has(m, 'hello', 'hi ', 'hey', 'salut', 'bonjour', 'what can you', 'que peux', 'capabilit') || m.trim() === 'help' || m.trim() === 'aide') {
    return {
      intro: t(
        `Hi ${firstName} 👋 I'm WORK AI, your career copilot. I can:\n\n• Match you with live jobs from your skills\n• Rewrite CV bullets with measurable impact\n• Run mock interview questions with feedback\n• Suggest skills for a role you're targeting\n• Help you negotiate salary\n\nWhat would you like to start with?`,
        `Salut ${firstName} 👋 Je suis WORK AI, ton copilote carrière. Je peux :\n\n• Te trouver des offres correspondant à tes compétences\n• Réécrire tes lignes de CV avec un impact mesurable\n• Te faire passer un entretien blanc avec retour\n• Suggérer des compétences pour un poste visé\n• T'aider à négocier ton salaire\n\nPar quoi veux-tu commencer ?`
      )
    };
  }

  // ── Default: substantive career guidance ──
  return {
    intro: t(
      `Good question. Here's how I'd approach it:\n\n• Get specific about the outcome you want — role, company type, timeline.\n• Audit the gap between where you are and that target.\n• Close the biggest gap first with one concrete project, not more theory.\n• Make progress visible — ship, post, and network here on WORK.\n\nTell me your target role and I can match jobs, suggest skills, or run a mock interview right now.`,
      `Bonne question. Voici comment je l'aborderais :\n\n• Sois précis sur l'objectif — poste, type d'entreprise, échéance.\n• Évalue l'écart entre ta situation et cette cible.\n• Comble d'abord le plus gros écart avec un projet concret, pas plus de théorie.\n• Rends tes progrès visibles — livre, publie et réseaute ici sur WORK.\n\nDis-moi le poste visé et je te trouve des offres, des compétences ou un entretien blanc tout de suite.`
    )
  };
}
