import { describe, expect, it } from 'vitest';
import { placementSteps } from '../onboarding';
import { SKILLS } from '../skills';
import { parseState } from '../state';

describe('placementSteps', () => {
  it('gives a total beginner nothing for free', () => {
    expect(placementSteps({ pullUps: 'none', handstand: 'none' })).toEqual([]);
  });

  it('credits earlier steps for someone who already has pull-ups', () => {
    const steps = placementSteps({ pullUps: '10+', handstand: 'none' });
    expect(steps).toEqual(expect.arrayContaining(['mu-1', 'mu-2', 'mu-3', 'mu-4', 'mu-5']));
    expect(steps).not.toContain('mu-6');
  });

  it('credits wall handstand work', () => {
    expect(placementSteps({ pullUps: 'none', handstand: 'wall-30' })).toEqual(expect.arrayContaining(['hs-1', 'hs-2', 'hs-3', 'pl-1']));
  });

  it('only ever returns step ids that exist', () => {
    const all = new Set(SKILLS.flatMap((s) => s.steps.map((st) => st.id)));
    for (const s of placementSteps({ pullUps: '10+', handstand: 'wall-30' })) expect(all.has(s)).toBe(true);
  });
});

describe('onboarding state', () => {
  const now = new Date('2026-03-01T12:00:00.000Z');
  it('sends brand-new users to the welcome flow', () => {
    expect(parseState(null, now).onboardedAt).toBeUndefined();
  });
  it('lets existing users with workouts skip it', () => {
    const raw = JSON.stringify({ lastSeenAt: '2026-02-01T00:00:00.000Z', workouts: [{ id: 'a', date: '2026-01-10T00:00:00.000Z', entries: [] }] });
    expect(parseState(raw, now).onboardedAt).toBe('2026-01-10T00:00:00.000Z');
  });
  it('keeps chosen focus skills', () => {
    const raw = JSON.stringify({ onboardedAt: '2026-02-01T00:00:00.000Z', focusSkills: ['planche', 42, 'handstand'] });
    const s = parseState(raw, now);
    expect(s.focusSkills).toEqual(['planche', 'handstand']);
    expect(s.onboardedAt).toBe('2026-02-01T00:00:00.000Z');
  });
});
