import { describe, it, expect, vi } from 'vitest';
import { planLocalReply } from './localAssistant';

// Mock the user model so the intent logic can be unit-tested without a DB.
// vi.mock is hoisted above imports by Vitest, so the stub is in place when
// localAssistant loads.
vi.mock('../../auth/auth.model', () => ({
  UserModel: {
    findById: () => ({
      select: () => ({
        lean: async () => ({ name: 'Demo User', role: 'student', headline: 'Frontend dev', skills: ['React'] })
      })
    })
  }
}));

describe('localAssistant.planLocalReply — intent routing', () => {
  it('routes job queries to the recommendJobs tool', async () => {
    const plan = await planLocalReply('find me remote jobs that match my skills', 'u1', 'en');
    expect(plan.tool?.name).toBe('recommendJobs');
    expect(plan.tool?.args).toMatchObject({ remote: true });
  });

  it('routes CV requests to improveCvBullets', async () => {
    const plan = await planLocalReply('rewrite my cv bullet about leading a team', 'u1', 'en');
    expect(plan.tool?.name).toBe('improveCvBullets');
  });

  it('routes interview practice to interviewQuestion', async () => {
    const plan = await planLocalReply('give me a mock interview question', 'u1', 'en');
    expect(plan.tool?.name).toBe('interviewQuestion');
  });

  it('routes skills questions to suggestSkills', async () => {
    const plan = await planLocalReply('what skills should I learn for backend', 'u1', 'en');
    expect(plan.tool?.name).toBe('suggestSkills');
  });

  it('answers salary negotiation with text, no tool', async () => {
    const plan = await planLocalReply('help me negotiate my salary', 'u1', 'en');
    expect(plan.tool).toBeUndefined();
    expect(plan.intro.toLowerCase()).toContain('negotiation');
  });

  it('greets and lists capabilities (no tool)', async () => {
    const plan = await planLocalReply('hi what can you do', 'u1', 'en');
    expect(plan.tool).toBeUndefined();
    expect(plan.intro).toContain('WORK AI');
  });

  it('falls back to substantive career guidance', async () => {
    const plan = await planLocalReply('how do I get promoted faster', 'u1', 'en');
    expect(plan.tool).toBeUndefined();
    expect(plan.intro.length).toBeGreaterThan(40);
  });

  it('responds in French when locale is fr', async () => {
    const plan = await planLocalReply('trouve moi des offres', 'u1', 'fr');
    expect(plan.tool?.name).toBe('recommendJobs');
    expect(plan.intro).toMatch(/offres|profil/i);
  });
});
