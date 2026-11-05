import { describe, expect, it } from 'vitest';

import { SKILLS, targetLabel } from '../skills';

const names = (id: string) => ({ 'pull-up': 'Pull-up', handstand: 'Handstand', 'muscle-up': 'Muscle-up' })[id];

describe('targetLabel', () => {
  it('describes reps, holds and added weight', () => {
    expect(targetLabel({ exerciseId: 'pull-up', reps: 5 }, names)).toBe('Pull-up · 5 reps');
    expect(targetLabel({ exerciseId: 'pull-up', reps: 1 }, names)).toBe('Pull-up · 1 rep');
    expect(targetLabel({ exerciseId: 'handstand', holdSec: 30 }, names)).toBe('Handstand · 30s hold');
    expect(targetLabel({ exerciseId: 'muscle-up', reps: 1, kg: 10 }, names)).toBe('Muscle-up · 1 rep +10 kg');
  });

  it('is empty for hand-ticked steps and falls back to the id for unknown exercises', () => {
    expect(targetLabel(undefined, names)).toBe('');
    expect(targetLabel({ exerciseId: 'mystery', reps: 3 }, names)).toBe('mystery · 3 reps');
  });

  it('has unique step ids across every skill', () => {
    const ids = SKILLS.flatMap((s) => s.steps.map((st) => st.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
