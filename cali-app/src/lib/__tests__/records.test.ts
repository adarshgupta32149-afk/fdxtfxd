import { describe, expect, it } from 'vitest';
import {
  completedStepIds,
  computeRecords,
  countSets,
  estimateOneRepMax,
  formatSet,
  setMeetsTarget,
  skillProgress,
  workoutsThisWeek,
} from '../records';
import { SKILLS } from '../skills';
import type { Workout } from '../types';

const w = (date: string, exerciseId: string, sets: Workout['entries'][number]['sets']): Workout => ({
  id: date + exerciseId,
  date,
  entries: [{ exerciseId, sets }],
});

describe('estimateOneRepMax', () => {
  it('returns the weight itself for a single rep', () => expect(estimateOneRepMax(100, 1)).toBe(100));
  it('uses Epley for multiple reps', () => expect(estimateOneRepMax(100, 5)).toBe(116.5));
  it('returns 0 for empty sets', () => expect(estimateOneRepMax(0, 5)).toBe(0));
});

describe('computeRecords', () => {
  it('tracks max reps, holds, weight and the latest date', () => {
    const recs = computeRecords([
      w('2026-01-01T00:00:00.000Z', 'pull-up', [{ reps: 8 }, { reps: 5, kg: 20 }]),
      w('2026-01-05T00:00:00.000Z', 'pull-up', [{ reps: 12 }]),
      w('2026-01-02T00:00:00.000Z', 'handstand', [{ holdSec: 15 }, { holdSec: 9 }]),
    ]);
    expect(recs['pull-up']).toMatchObject({ maxReps: 12, maxKg: 20, lastDate: '2026-01-05T00:00:00.000Z' });
    expect(recs['pull-up'].est1RM).toBeUndefined();
    expect(recs['handstand'].maxHoldSec).toBe(15);
  });

  it('estimates a 1RM for lifts only', () => {
    const recs = computeRecords([w('2026-01-01T00:00:00.000Z', 'bench-press', [{ reps: 5, kg: 100 }, { reps: 1, kg: 110 }])]);
    expect(recs['bench-press'].est1RM).toBe(116.5);
    expect(recs['bench-press'].maxKg).toBe(110);
  });
});

describe('setMeetsTarget', () => {
  it('requires every specified measure', () => {
    expect(setMeetsTarget({ reps: 1, kg: 10 }, { exerciseId: 'muscle-up', reps: 1, kg: 10 })).toBe(true);
    expect(setMeetsTarget({ reps: 3 }, { exerciseId: 'muscle-up', reps: 1, kg: 10 })).toBe(false);
  });
  it('lets a weighted set count towards a bodyweight goal', () => {
    expect(setMeetsTarget({ reps: 10, kg: 5 }, { exerciseId: 'pull-up', reps: 10 })).toBe(true);
  });
  it('never completes an empty target', () => {
    expect(setMeetsTarget({ reps: 10 }, { exerciseId: 'pull-up' })).toBe(false);
  });
});

describe('skill progress', () => {
  it('completes steps from logs and manual ticks', () => {
    const done = completedStepIds({
      workouts: [w('2026-01-01T00:00:00.000Z', 'pull-up', [{ reps: 6 }])],
      manualSteps: { 'mu-6': '2026-01-02T00:00:00.000Z' },
    });
    expect(done.has('mu-3')).toBe(true); // first pull-up
    expect(done.has('mu-4')).toBe(true); // 5 pull-ups
    expect(done.has('mu-5')).toBe(false); // 10 pull-ups
    expect(done.has('mu-6')).toBe(true); // ticked by hand

    const muscleUp = SKILLS.find((s) => s.id === 'muscle-up')!;
    const p = skillProgress(muscleUp, done);
    expect(p.done).toBe(3);
    expect(p.nextStep?.id).toBe('mu-1');
  });
});

describe('weekly helpers', () => {
  it('only counts workouts since Monday', () => {
    const now = new Date(2026, 10, 4, 18, 0); // Wednesday 4 Nov 2026, local time
    const list = [
      w(new Date(2026, 10, 2, 9, 0).toISOString(), 'push-up', [{ reps: 20 }, { reps: 15 }]), // Monday
      w(new Date(2026, 10, 1, 9, 0).toISOString(), 'push-up', [{ reps: 20 }]), // Sunday before
    ];
    const week = workoutsThisWeek(list, now);
    expect(week).toHaveLength(1);
    expect(countSets(week)).toBe(2);
  });
});

describe('formatSet', () => {
  it('formats reps, holds and weight', () => {
    expect(formatSet({ reps: 8 })).toBe('8 reps');
    expect(formatSet({ holdSec: 30 })).toBe('30s');
    expect(formatSet({ reps: 5, kg: 20 })).toBe('5 reps @ 20kg');
  });
});
