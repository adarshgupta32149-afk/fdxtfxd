import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state';
import { clearAccountData, isFirstSync, mergeRemote, planSync, prepareForUser, workoutFromRow, type RemoteSnapshot, type SyncOutcome } from '../sync';
import type { AppState, Workout } from '../types';

const now = new Date('2026-03-01T12:00:00.000Z');
const wk = (id: string, date = '2026-02-01T10:00:00.000Z'): Workout => ({ id, date, entries: [{ exerciseId: 'pull-up', sets: [{ reps: 5 }] }] });

const local = (over: Partial<AppState> = {}): AppState => ({ ...createInitialState(now), ...over });
const remote = (over: Partial<RemoteSnapshot> = {}): RemoteSnapshot => ({
  workouts: [],
  steps: {},
  profile: { displayName: null, bodyweightKg: null, trialStartedAt: now.toISOString(), isPro: false },
  ...over,
});
const outcome = (over: Partial<SyncOutcome> = {}): SyncOutcome => ({
  userId: 'user-1',
  firstSync: true,
  clearedWorkoutDeletes: [],
  clearedStepRemovals: [],
  serverProfile: { displayName: null, bodyweightKg: null },
  ...over,
});

describe('account switching', () => {
  it('treats a phone with no owner as a first sync', () => {
    expect(isFirstSync(local(), 'user-1')).toBe(true);
    expect(isFirstSync(local({ ownerId: 'user-1' }), 'user-1')).toBe(false);
  });

  it("clears another account's data before syncing a new account", () => {
    const s = local({ ownerId: 'someone-else', workouts: [wk('a')], manualSteps: { 'mu-6': 'x' }, profile: { displayName: 'Old' } });
    const prepared = prepareForUser(s, 'user-1');
    expect(prepared.workouts).toEqual([]);
    expect(prepared.manualSteps).toEqual({});
    expect(prepared.profile.displayName).toBe('');
  });

  it('keeps unowned local data so it can be uploaded on first sign-in', () => {
    const s = local({ workouts: [wk('a')] });
    expect(prepareForUser(s, 'user-1').workouts).toHaveLength(1);
  });

  it('keeps trial dates when clearing account data', () => {
    const s = local({ trialStartedAt: '2026-01-01T00:00:00.000Z', isPro: true, workouts: [wk('a')] });
    const cleared = clearAccountData(s);
    expect(cleared.trialStartedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(cleared.isPro).toBe(false);
    expect(cleared.workouts).toEqual([]);
  });
});

describe('planSync', () => {
  it('uploads only what the server is missing', () => {
    const plan = planSync(local({ workouts: [wk('a'), wk('b')], manualSteps: { 'mu-6': 'd1', 'pl-2': 'd2' } }), remote({ workouts: [wk('a')], steps: { 'mu-6': 'd1' } }), true);
    expect(plan.uploadWorkouts.map((w) => w.id)).toEqual(['b']);
    expect(plan.uploadSteps).toEqual([{ stepId: 'pl-2', doneAt: 'd2' }]);
  });

  it('sends pending deletions that exist on the server, and never re-uploads them', () => {
    const s = local({ ownerId: 'user-1', workouts: [], pendingWorkoutDeletes: ['a', 'gone'], pendingStepRemovals: ['mu-6'] });
    const plan = planSync(s, remote({ workouts: [wk('a')], steps: { 'mu-6': 'd' } }), false);
    expect(plan.deleteWorkoutIds).toEqual(['a']);
    expect(plan.deleteStepIds).toEqual(['mu-6']);
    expect(plan.uploadWorkouts).toEqual([]);
  });

  it('on first sync keeps the server name but fills an empty one from the phone', () => {
    expect(planSync(local({ profile: { displayName: 'Phone' } }), remote({ profile: { ...remote().profile, displayName: 'Server' } }), true).profileUpdate).toBeNull();
    expect(planSync(local({ profile: { displayName: 'Phone', bodyweightKg: 70 } }), remote(), true).profileUpdate).toEqual({ display_name: 'Phone', bodyweight_kg: 70 });
  });

  it('after linking, pushes the latest phone edits', () => {
    const s = local({ ownerId: 'user-1', profile: { displayName: 'New name', bodyweightKg: 75 } });
    const r = remote({ profile: { ...remote().profile, displayName: 'Old name', bodyweightKg: 75 } });
    expect(planSync(s, r, false).profileUpdate).toEqual({ display_name: 'New name', bodyweight_kg: 75 });
  });
});

describe('mergeRemote', () => {
  it('combines phone and server workouts, newest first', () => {
    const merged = mergeRemote(
      local({ workouts: [wk('phone', '2026-02-03T00:00:00.000Z')] }),
      remote({ workouts: [wk('server', '2026-02-05T00:00:00.000Z')] }),
      outcome(),
    );
    expect(merged.workouts.map((w) => w.id)).toEqual(['server', 'phone']);
    expect(merged.ownerId).toBe('user-1');
  });

  it('keeps a workout logged while the sync was running', () => {
    const during = local({ workouts: [wk('logged-mid-sync')] });
    expect(mergeRemote(during, remote(), outcome()).workouts.map((w) => w.id)).toEqual(['logged-mid-sync']);
  });

  it('does not bring back a workout whose deletion is still pending', () => {
    const s = local({ ownerId: 'user-1', pendingWorkoutDeletes: ['a'] });
    const merged = mergeRemote(s, remote({ workouts: [wk('a')] }), outcome({ firstSync: false }));
    expect(merged.workouts).toEqual([]);
    expect(merged.pendingWorkoutDeletes).toEqual(['a']);
  });

  it('clears deletions that reached the server', () => {
    const s = local({ ownerId: 'user-1', pendingWorkoutDeletes: ['a'], pendingStepRemovals: ['mu-6'] });
    const merged = mergeRemote(s, remote(), outcome({ firstSync: false, clearedWorkoutDeletes: ['a'], clearedStepRemovals: ['mu-6'] }));
    expect(merged.pendingWorkoutDeletes).toEqual([]);
    expect(merged.pendingStepRemovals).toEqual([]);
  });

  it('can only move the trial earlier, never later', () => {
    const earlierOnServer = mergeRemote(local({ trialStartedAt: '2026-02-01T00:00:00.000Z' }), remote({ profile: { ...remote().profile, trialStartedAt: '2026-01-01T00:00:00.000Z' } }), outcome());
    expect(earlierOnServer.trialStartedAt).toBe('2026-01-01T00:00:00.000Z');
    const laterOnServer = mergeRemote(local({ trialStartedAt: '2026-01-01T00:00:00.000Z' }), remote({ profile: { ...remote().profile, trialStartedAt: '2026-02-01T00:00:00.000Z' } }), outcome());
    expect(laterOnServer.trialStartedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('takes Pro status from the server', () => {
    expect(mergeRemote(local({ isPro: true }), remote(), outcome()).isPro).toBe(false);
    expect(mergeRemote(local(), remote({ profile: { ...remote().profile, isPro: true } }), outcome()).isPro).toBe(true);
  });

  it("never merges another account's leftovers into this one", () => {
    const s = local({ ownerId: 'someone-else', workouts: [wk('theirs')] });
    expect(mergeRemote(s, remote({ workouts: [wk('mine')] }), outcome()).workouts.map((w) => w.id)).toEqual(['mine']);
  });
});

describe('workoutFromRow', () => {
  it('rebuilds a workout and drops malformed entries', () => {
    const w = workoutFromRow({ id: 'a', date: '2026-02-01T10:00:00+00:00', entries: [{ exerciseId: 'dip', sets: [{ reps: 8 }] }, { junk: true }], note: null });
    expect(w).toEqual({ id: 'a', date: '2026-02-01T10:00:00.000Z', entries: [{ exerciseId: 'dip', sets: [{ reps: 8 }] }] });
  });
  it('rejects rows whose entries are not a list', () => {
    expect(workoutFromRow({ id: 'a', date: '2026-02-01T10:00:00Z', entries: { nope: 1 }, note: null })).toBeNull();
  });
});
