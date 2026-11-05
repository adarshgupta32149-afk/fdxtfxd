import { describe, expect, it } from 'vitest';

import { frequentExercises, previousSets, shortSet } from '../records';
import type { Workout } from '../types';

const w = (id: string, date: string, entries: Workout['entries']): Workout => ({ id, date, entries });

describe('previousSets', () => {
  const workouts = [
    w('a', '2026-11-01T10:00:00.000Z', [{ exerciseId: 'pull-up', sets: [{ reps: 5 }] }]),
    w('b', '2026-11-03T10:00:00.000Z', [{ exerciseId: 'pull-up', sets: [{ reps: 8 }, { reps: 6, kg: 5 }] }]),
    w('c', '2026-11-04T10:00:00.000Z', [{ exerciseId: 'dip', sets: [{ reps: 10 }] }]),
  ];

  it('uses the latest workout that had the exercise, whatever the array order', () => {
    expect(previousSets(workouts, 'pull-up')).toEqual([{ reps: 8 }, { reps: 6, kg: 5 }]);
    expect(previousSets([...workouts].reverse(), 'pull-up')).toEqual([{ reps: 8 }, { reps: 6, kg: 5 }]);
  });

  it('is empty for an exercise never logged', () => {
    expect(previousSets(workouts, 'planche')).toEqual([]);
  });

  it('ranks frequent exercises', () => {
    expect(frequentExercises(workouts)).toEqual(['pull-up', 'dip']);
  });
});

describe('shortSet', () => {
  it('formats reps, weight and holds compactly', () => {
    expect(shortSet({ reps: 8 })).toBe('8');
    expect(shortSet({ reps: 6, kg: 5 })).toBe('6 +5');
    expect(shortSet({ holdSec: 30 })).toBe('30s');
  });
});
