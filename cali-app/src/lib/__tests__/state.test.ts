import { describe, expect, it } from 'vitest';
import { createInitialState, parseState, touchLastSeen } from '../state';

const now = new Date('2026-03-01T12:00:00.000Z');

describe('parseState', () => {
  it('starts fresh when nothing is stored', () => {
    expect(parseState(null, now)).toEqual(createInitialState(now));
  });

  it('starts fresh on corrupted JSON instead of crashing', () => {
    expect(parseState('{not json', now).workouts).toEqual([]);
  });

  it('keeps valid data and drops broken workouts', () => {
    const raw = JSON.stringify({
      trialStartedAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-02-01T00:00:00.000Z',
      isPro: true,
      workouts: [
        { id: 'a', date: '2026-01-10T00:00:00.000Z', entries: [] },
        { id: 'b', date: 'garbage', entries: [] },
      ],
      manualSteps: { 'mu-6': '2026-01-03T00:00:00.000Z' },
      profile: { displayName: 'Leo', bodyweightKg: 72 },
    });
    const s = parseState(raw, now);
    expect(s.trialStartedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(s.isPro).toBe(true);
    expect(s.workouts.map((w) => w.id)).toEqual(['a']);
    expect(s.profile).toEqual({ displayName: 'Leo', bodyweightKg: 72 });
  });

  it('does not hand out a fresh trial when the trial date is corrupted', () => {
    const raw = JSON.stringify({
      trialStartedAt: 'broken',
      lastSeenAt: '2026-02-20T00:00:00.000Z',
      workouts: [{ id: 'a', date: '2025-12-01T00:00:00.000Z', entries: [] }],
    });
    expect(parseState(raw, now).trialStartedAt).toBe('2025-12-01T00:00:00.000Z');
  });
});

describe('touchLastSeen', () => {
  it('moves forward but never backwards', () => {
    const s = createInitialState(now);
    expect(touchLastSeen(s, new Date('2026-03-02T00:00:00.000Z')).lastSeenAt).toBe('2026-03-02T00:00:00.000Z');
    expect(touchLastSeen(s, new Date('2026-02-01T00:00:00.000Z'))).toBe(s);
  });
});
