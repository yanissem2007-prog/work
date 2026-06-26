import { UserModel } from '../../auth/auth.model';

/**
 * Built-in career mentor + general assistant used when no OpenAI key is set.
 * It detects intent, pulls real platform data via the tool layer, and otherwise
 * holds a genuine conversation across many topics (tech, learning, productivity,
 * motivation, startups, small talk…). Fully functional with zero external API.
 * The moment OPENAI_API_KEY exists, the real model takes over automatically.
 */
export interface LocalPlan {
  intro: string;
  tool?: { name: string; args: Record<string, unknown> };
  closing?: string;
}

type Msg = { role: 'user' | 'assistant'; content: string };

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ── Knowledge base: substantive answers on common topics ──
type Topic = { keys: string[]; en: string; fr: string };
const KNOWLEDGE: Topic[] = [
  { keys: ['react'], en: 'React is a JavaScript library for building UIs from components. Core ideas: components, props/state, the virtual DOM, and hooks (useState, useEffect). Pair it with Next.js for routing, SSR and a real app structure. Start by building one small project end to end — that beats ten tutorials.', fr: "React est une librairie JS pour construire des interfaces par composants. Idées clés : composants, props/state, virtual DOM, et les hooks (useState, useEffect). Associe-le à Next.js pour le routing et le SSR. Le meilleur départ : livre un petit projet de bout en bout plutôt que 10 tutos." },
  { keys: ['typescript', 'type script'], en: 'TypeScript is JavaScript with static types. It catches bugs before runtime and makes large codebases maintainable. Learn: types vs interfaces, generics, unions/narrowing, and utility types (Partial, Pick, Record). Turn on strict mode from day one.', fr: "TypeScript = JavaScript avec des types statiques. Il attrape les bugs avant l'exécution et rend les gros projets maintenables. À apprendre : types vs interfaces, génériques, unions/narrowing, et les utilitaires (Partial, Pick, Record). Active strict dès le début." },
  { keys: ['javascript', 'js '], en: 'JavaScript runs the web. Master the fundamentals: scope & closures, the event loop, promises/async-await, array methods (map/filter/reduce), and the DOM. Everything else (React, Node) builds on these.', fr: "JavaScript fait tourner le web. Maîtrise les bases : scope & closures, l'event loop, promises/async-await, les méthodes de tableaux (map/filter/reduce), et le DOM. Tout le reste (React, Node) repose dessus." },
  { keys: ['python'], en: 'Python is readable, batteries-included, and dominant in data/AI and scripting. Learn the basics, then pick a track: data (pandas, numpy), web (FastAPI/Django), or automation. Project-first beats theory.', fr: "Python est lisible et roi en data/IA et scripting. Apprends les bases, puis choisis une voie : data (pandas, numpy), web (FastAPI/Django), ou automatisation. Le projet d'abord, la théorie ensuite." },
  { keys: ['node', 'express', 'backend'], en: 'Node.js runs JavaScript on the server; Express is the classic minimal web framework. Learn: HTTP/REST, middleware, async I/O, a database (MongoDB or Postgres), auth (JWT), and error handling. Build an API with real CRUD + auth.', fr: "Node.js exécute du JS côté serveur ; Express est le framework web minimal classique. À apprendre : HTTP/REST, middleware, I/O async, une base (MongoDB ou Postgres), l'auth (JWT), la gestion d'erreurs. Construis une API avec CRUD + auth." },
  { keys: ['ai', 'artificial intelligence', 'machine learning', 'ml ', 'intelligence artificielle', 'llm', 'gpt'], en: "Modern AI is mostly machine learning: models learn patterns from data. The current wave is LLMs (large language models) that predict text. To get into it: solid Python, then the math (linear algebra, probability), then frameworks (PyTorch), then ship a small project. You don't need a PhD to start — you need reps.", fr: "L'IA moderne, c'est surtout du machine learning : des modèles apprennent des motifs depuis des données. La vague actuelle, ce sont les LLM (grands modèles de langage) qui prédisent du texte. Pour s'y mettre : Python solide, puis les maths (algèbre linéaire, probas), puis un framework (PyTorch), puis un petit projet. Pas besoin d'un doctorat — il faut des répétitions." },
  { keys: ['css', 'tailwind', 'design system'], en: 'CSS is layout + visual design for the web. Learn flexbox and grid first (they solve 90% of layouts), then custom properties (variables), then a system like Tailwind for speed. Good UI = hierarchy through scale contrast + consistent spacing, not decoration.', fr: "Le CSS, c'est la mise en page et le design web. Apprends flexbox et grid d'abord (90% des layouts), puis les variables CSS, puis un système comme Tailwind pour la vitesse. Une bonne UI = hiérarchie par le contraste d'échelle + espacement cohérent, pas de la déco." },
  { keys: ['git', 'github'], en: 'Git tracks your code history; GitHub hosts it and enables collaboration. Daily flow: branch → commit small → push → open a PR. Learn merge vs rebase, and how to resolve conflicts calmly. Commit messages should explain *why*, not *what*.', fr: "Git suit l'historique de ton code ; GitHub l'héberge et permet la collaboration. Flux quotidien : branche → petits commits → push → PR. Apprends merge vs rebase et à résoudre les conflits calmement. Un message de commit explique le *pourquoi*, pas le *quoi*." },
  { keys: ['database', 'sql', 'mongodb', 'postgres', 'base de don'], en: 'Databases store your app data. SQL (Postgres) = structured tables + relations, great for most apps. NoSQL (MongoDB) = flexible documents, great for fast iteration. Learn: schema design, indexes (the #1 perf lever), and avoiding N+1 queries.', fr: "Les bases de données stockent les données de l'app. SQL (Postgres) = tables structurées + relations, idéal pour la plupart des apps. NoSQL (MongoDB) = documents flexibles, idéal pour itérer vite. À apprendre : design de schéma, index (le levier perf n°1), éviter les requêtes N+1." },
  { keys: ['learn', 'apprendre', 'study', 'étudier', 'how to get good', 'progress'], en: "How to learn anything fast: 1) Pick ONE concrete outcome. 2) Learn just enough to start, then build. 3) Space your practice (little, daily > a lot, rarely). 4) Teach it / explain it out loud. 5) Get feedback fast. Theory without building is just entertainment.", fr: "Apprendre vite, n'importe quoi : 1) Choisis UN résultat concret. 2) Apprends le strict minimum pour démarrer, puis construis. 3) Espace ta pratique (un peu, chaque jour > beaucoup, rarement). 4) Explique-le à voix haute. 5) Obtiens du feedback vite. La théorie sans pratique, c'est juste du divertissement." },
  { keys: ['productiv', 'focus', 'concentr', 'time management', 'gérer mon temps', 'procrastin'], en: "Productivity that actually works: pick the ONE task that matters most and do it first, before email. Work in focused 50-min blocks, phone in another room. Beat procrastination by shrinking the task — 'open the file and write one line.' Momentum does the rest.", fr: "La productivité qui marche vraiment : choisis LA tâche qui compte le plus et fais-la en premier, avant les mails. Travaille en blocs concentrés de 50 min, téléphone dans une autre pièce. Contre la procrastination : réduis la tâche — « ouvre le fichier et écris une ligne ». L'élan fait le reste." },
  { keys: ['motivat', 'discipline', 'give up', 'burnout', 'burn out', 'épuis', 'démotiv', 'tired', 'fatigue'], en: "Motivation is unreliable — systems beat willpower. Make the next step so small you can't say no. Track a streak; don't break the chain. And rest on purpose: burnout comes from no recovery, not from hard work. You're closer than you think — keep going.", fr: "La motivation est instable — les systèmes battent la volonté. Rends la prochaine étape si petite que tu ne peux pas refuser. Suis une série ; ne brise pas la chaîne. Et repose-toi exprès : le burnout vient du manque de récupération, pas du travail. Tu es plus près que tu crois — continue." },
  { keys: ['startup', 'found', 'entreprendre', 'business', 'idea', 'idée'], en: "Startups: solve a real, painful problem for a specific person — then talk to 20 of them before writing code. Build the smallest thing that delivers value, ship it, learn, iterate. Distribution matters as much as the product. Most ideas die from no users, not bad code.", fr: "Startups : résous un problème réel et douloureux pour une personne précise — puis parle à 20 d'entre elles avant d'écrire du code. Construis le plus petit truc qui apporte de la valeur, livre-le, apprends, itère. La distribution compte autant que le produit. La plupart des idées meurent par manque d'utilisateurs, pas de mauvais code." },
  { keys: ['network', 'réseau', 'connect', 'linkedin'], en: "Networking that isn't sleazy: be useful first. Share what you learn publicly, comment thoughtfully, help people with no agenda. Your network is the people who've seen you do good work. On WORK, post your projects and follow people building what you want to build.", fr: "Réseauter sans être lourd : sois utile d'abord. Partage ce que tu apprends publiquement, commente avec soin, aide sans arrière-pensée. Ton réseau, ce sont les gens qui t'ont vu faire du bon travail. Sur WORK, publie tes projets et suis les gens qui construisent ce que tu veux construire." },
  { keys: ['money', 'argent', 'finance', 'save', 'invest', 'épargn'], en: "Money basics (not advice, just principles): spend less than you earn, keep a buffer of a few months, then let time + consistency compound. Avoid lifestyle creep when income rises. The biggest lever early in a career is usually growing your income (skills), not pinching pennies.", fr: "Bases de l'argent (pas un conseil, juste des principes) : dépense moins que tu ne gagnes, garde un coussin de quelques mois, puis laisse le temps + la régularité composer. Évite d'augmenter ton train de vie quand le revenu monte. En début de carrière, le plus gros levier est souvent d'augmenter ton revenu (compétences), pas de rogner sur les centimes." }
];

export async function planLocalReply(input: Msg[] | string, userId: string, locale = 'en'): Promise<LocalPlan> {
  const messages: Msg[] = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const m = last.toLowerCase().trim();
  const fr = locale.toLowerCase().startsWith('fr');
  const t = (en: string, frx: string) => (fr ? frx : en);

  const user = await UserModel.findById(userId).select('name role headline skills').lean();
  const firstName = user?.name?.split(' ')[0] ?? '';
  const role = (user?.headline || user?.role || 'professional') as string;

  // ── Small talk ──
  if (has(m, 'how are you', 'ça va', 'ca va', 'how r u', "what's up", 'quoi de neuf')) {
    return { intro: t(
      `I'm running great, thanks for asking ${firstName} 🙂 More importantly — how are *you*, and what are we working on today?`,
      `Je tourne au top, merci ${firstName} 🙂 Mais surtout — toi, comment ça va, et on bosse sur quoi aujourd'hui ?`
    )};
  }
  if (has(m, 'who are you', 'who r u', 'qui es-tu', 'qui es tu', "what are you", 'are you a bot', 'are you human', 'are you ai', 'tu es un robot', 'es-tu humain')) {
    return { intro: t(
      `I'm WORK AI — your built-in career mentor and assistant. I can talk through tech, learning, motivation and ideas, and I also plug into the platform: I see your profile and live jobs, so I can match roles, sharpen your CV, run mock interviews and more. What's on your mind?`,
      `Je suis WORK AI — ton mentor carrière et assistant intégré. On peut parler tech, apprentissage, motivation, idées… et je suis branché à la plateforme : je vois ton profil et les offres en direct, donc je peux te matcher des jobs, améliorer ton CV, simuler des entretiens, etc. Tu penses à quoi ?`
    )};
  }
  if (has(m, 'thank', 'merci', 'thx', 'thanks')) {
    return { intro: pick(fr
      ? ['Avec plaisir 🙌 Autre chose ?', 'Quand tu veux 👍 On continue ?', 'De rien ! Dis-moi si tu veux creuser un point.']
      : ["Anytime 🙌 Want to dig into anything else?", "Happy to help 👍 What's next?", "You got it! Tell me where to go deeper."]) };
  }
  if (has(m, 'bye', 'goodbye', 'au revoir', 'à plus', 'a plus', 'see you', 'bonne nuit', 'good night')) {
    return { intro: t(
      `See you ${firstName}! Go ship something today. I'm here whenever you need me. 👋`,
      `À plus ${firstName} ! Va livrer un truc aujourd'hui. Je suis là dès que tu as besoin. 👋`
    )};
  }
  if (has(m, 'hello', 'hi ', 'hey', 'salut', 'bonjour', 'yo ', 'coucou') && m.length < 24) {
    return { intro: t(
      `Hey ${firstName} 👋 I'm WORK AI. I can help with your career (jobs, CV, interviews, skills) or just talk through tech, learning, ideas — anything on your mind. Where do we start?`,
      `Hey ${firstName} 👋 Je suis WORK AI. Je peux t'aider côté carrière (jobs, CV, entretiens, compétences) ou juste discuter tech, apprentissage, idées — ce que tu veux. On commence par quoi ?`
    )};
  }

  // ── Career intents (with tools, grounded in real data) ──
  if (has(m, 'job', 'jobs', 'offre', 'emploi', 'poste', 'hiring', 'recrut', 'recommend', 'recommand', 'remote', 'télétravail', 'opportun')) {
    const remote = has(m, 'remote', 'télétravail', 'distanciel');
    const sal = m.match(/(\d{2,3})\s?k|\$?\s?(\d{2,3})[\s,]?000/);
    const minSalary = sal ? Number(sal[1] ?? sal[2]) * 1000 : undefined;
    return {
      intro: t(`Here are live roles matched to your profile${remote ? ' (remote only)' : ''}:`, `Voici des offres en direct correspondant à ton profil${remote ? ' (télétravail uniquement)' : ''} :`),
      tool: { name: 'recommendJobs', args: { remote: remote || undefined, minSalary, limit: 5 } },
      closing: t('Tap any role to apply. Want me to filter by remote or salary?', 'Clique sur une offre pour postuler. Je filtre par télétravail ou salaire ?')
    };
  }
  if (has(m, 'cv', 'resume', 'résumé', 'bullet', 'experience', 'expérience')) {
    return {
      intro: t("Here's how I'd sharpen that into measurable, recruiter-ready bullets:", 'Voici comment transformer ça en lignes mesurables, prêtes pour les recruteurs :'),
      tool: { name: 'improveCvBullets', args: { draft: last, role } },
      closing: t('Swap the brackets for your real numbers. Tailor these to a specific job?', 'Remplace les crochets par tes vrais chiffres. Je les adapte à une offre précise ?')
    };
  }
  if (has(m, 'interview', 'entretien', 'mock', 'practice', 'practise')) {
    const kind = has(m, 'system', 'système', 'design') ? 'system-design' : has(m, 'technical', 'technique', 'coding', 'algo') ? 'technical' : has(m, 'product', 'produit') ? 'product' : 'behavioral';
    const roleMatch = last.match(/(?:for an?|pour un[e]?|as an?)\s+([^.?!]+)/i);
    return {
      intro: t("Let's practice. Here's a realistic question — take your time:", "On s'entraîne. Voici une question réaliste — prends ton temps :"),
      tool: { name: 'interviewQuestion', args: { role: roleMatch?.[1]?.trim() || role, kind } },
      closing: t("Reply with your answer and I'll give feedback against the rubric.", 'Réponds et je te ferai un retour selon la grille.')
    };
  }
  if (has(m, 'skill', 'compétence', 'competence') && !has(m, 'what is', "c'est quoi", 'explain')) {
    const roleMatch = last.match(/(?:for|to be|become|pour|devenir)\s+(?:an?\s+)?([^.?!]+)/i);
    return {
      intro: t('Based on that target, here are high-leverage skills to add:', 'Pour ce poste visé, voici les compétences à fort impact à ajouter :'),
      tool: { name: 'suggestSkills', args: { targetRole: roleMatch?.[1]?.trim() || role } },
      closing: t('Add these to your profile to unlock more matches.', 'Ajoute-les à ton profil pour débloquer plus de matchs.')
    };
  }
  if (has(m, 'my profile', 'mon profil', 'who am i', 'about me', 'qui suis')) {
    return { intro: t("Here's your current snapshot on WORK:", 'Voici ton profil actuel sur WORK :'), tool: { name: 'getMyProfile', args: {} }, closing: t('Want improvements or matching jobs?', 'Je te suggère des améliorations ou des offres ?') };
  }
  if (has(m, 'salary', 'salaire', 'negotiat', 'négoci', 'offer', 'rémunér', 'raise', 'augmentation')) {
    return { intro: t(
      `Salary negotiation, fast framework:\n1. Anchor high but credible — research the band, ask for the top third.\n2. Avoid naming the first number.\n3. Negotiate the whole package: base, equity, sign-on, remote, learning budget.\n4. Use a competing offer as honest leverage.\n5. Get it in writing before you accept.\n\nScript: "I'm excited about the role. Based on my experience and market data, I expected a base around [X]. Can we get there?"`,
      `Négociation salariale, méthode rapide :\n1. Ancre haut mais crédible — vise le tiers supérieur de la fourchette.\n2. Évite de donner le premier chiffre.\n3. Négocie tout le package : fixe, equity, prime d'arrivée, télétravail, budget formation.\n4. Utilise une offre concurrente comme levier honnête.\n5. Obtiens-le par écrit avant d'accepter.\n\nScript : « Le poste m'enthousiasme. Vu mon expérience et le marché, je visais un fixe autour de [X]. On peut s'en approcher ? »`
    )};
  }
  if (has(m, 'roadmap', 'devenir', 'become', 'transition', 'career change', 'reconvers', 'career path', 'plan de carrière')) {
    const roleMatch = last.match(/(?:become|be an?|devenir|vers)\s+(?:an?\s+)?([^.?!]+)/i);
    const target = roleMatch?.[1]?.trim() || role;
    return {
      intro: t(`A pragmatic 90-day roadmap toward ${target}:\n• Weeks 1–3: master the fundamentals + ship one small project.\n• Weeks 4–7: build a portfolio piece that mirrors the real job.\n• Weeks 8–10: contribute publicly (open source, posts) to build proof.\n• Weeks 11–13: apply with a tailored CV + practice interviews here.\nSkills to prioritise:`,
        `Roadmap pragmatique sur 90 jours vers ${target} :\n• Semaines 1–3 : fondamentaux + un petit projet livré.\n• Semaines 4–7 : une pièce de portfolio proche du vrai job.\n• Semaines 8–10 : contribue publiquement (open source, posts).\n• Semaines 11–13 : postule avec un CV ciblé + entraîne-toi aux entretiens ici.\nCompétences à prioriser :`),
      tool: { name: 'suggestSkills', args: { targetRole: target } },
      closing: t('Open the Roadmap tab for a detailed week-by-week plan.', "Ouvre l'onglet Roadmap pour un plan détaillé semaine par semaine.")
    };
  }

  // ── Platform help ──
  if (has(m, 'what is work', "c'est quoi work", 'what can you do', 'que peux-tu', 'how does work', 'comment ça marche', 'comment marche')) {
    return { intro: t(
      `WORK is a career operating system: a job platform, a professional social feed, Discord-style communities, a CV builder, and an AI mentor (me) — in one place. Tell me a goal (a job, a skill, a project) and I'll help you move on it right now.`,
      `WORK est un système d'exploitation pour ta carrière : plateforme d'emploi, fil social pro, communautés à la Discord, éditeur de CV, et un mentor IA (moi) — au même endroit. Donne-moi un objectif (un job, une compétence, un projet) et je t'aide à avancer tout de suite.`
    )};
  }

  // ── Knowledge base (tech / learning / life) ──
  for (const topic of KNOWLEDGE) {
    if (has(m, ...topic.keys)) {
      return { intro: fr ? topic.fr : topic.en, closing: t('Want a learning roadmap or a project idea for this?', 'Tu veux une roadmap ou une idée de projet là-dessus ?') };
    }
  }

  // ── "what is X / explain X" with no known topic ──
  const defMatch = last.match(/(?:what(?:'s| is)|explain|c'est quoi|qu'est[- ]ce que|c quoi)\s+(?:an?\s+|le |la |les |un |une )?(.+)/i);
  if (defMatch) {
    const subject = defMatch[1].replace(/[?.!]+$/, '').trim();
    return { intro: t(
      `Good question about "${subject}". I don't have a deep canned entry for that yet, but here's how I'd approach it: define what it *does* and the problem it solves, find one clear example, then learn it by using it on a tiny project. If it's career- or tech-related, ask me to suggest skills, a roadmap or jobs around it.`,
      `Bonne question sur « ${subject} ». Je n'ai pas encore de fiche détaillée là-dessus, mais voici comment je l'aborderais : définis ce que ça *fait* et le problème que ça résout, trouve un exemple clair, puis apprends-le en l'utilisant sur un mini-projet. Si c'est lié à la carrière ou la tech, demande-moi des compétences, une roadmap ou des offres autour.`
    )};
  }

  // ── Smart default: engage with the topic, vary the response ──
  return { intro: t(
    pick([
      `Interesting — tell me a bit more about "${trim(last)}" and what you're trying to get out of it. Meanwhile, here's my instinct: get specific about the outcome, close the biggest gap with one concrete step, and make your progress visible. I can also match jobs, suggest skills, or run a mock interview whenever you want.`,
      `Good one. I'd approach "${trim(last)}" like this: clarify the real goal, do the smallest useful action today, and get feedback fast. Want me to go deeper, or turn it into a plan, jobs or skills on WORK?`,
      `Let's dig into "${trim(last)}". Give me one more detail about your situation and I'll get specific. And remember — I can also recommend jobs, sharpen your CV, or coach you through an interview here.`
    ]),
    pick([
      `Intéressant — dis-m'en un peu plus sur « ${trim(last)} » et ce que tu veux en tirer. Mon instinct : sois précis sur l'objectif, comble le plus gros écart par une action concrète, et rends tes progrès visibles. Je peux aussi te matcher des jobs, suggérer des compétences ou simuler un entretien.`,
      `Bonne question. J'aborderais « ${trim(last)} » ainsi : clarifie le vrai objectif, fais la plus petite action utile aujourd'hui, obtiens du feedback vite. Tu veux que je creuse, ou que j'en fasse un plan, des jobs ou des compétences sur WORK ?`,
      `Creusons « ${trim(last)} ». Donne-moi un détail de plus sur ta situation et je deviens précis. Et souviens-toi — je peux aussi recommander des offres, améliorer ton CV ou te coacher pour un entretien.`
    ])
  )};
}

function trim(s: string, n = 60): string {
  const x = s.trim();
  return x.length > n ? x.slice(0, n) + '…' : x;
}
