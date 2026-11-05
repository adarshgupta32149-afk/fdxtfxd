import type { AppState, ExerciseEntry, Profile, Workout } from './types';

/** What the server holds for the signed-in user. */
export interface RemoteSnapshot {
  workouts: Workout[];
  /** Hand-ticked steps: step id -> ISO date. */
  steps: Record<string, string>;
  profile: {
    displayName: string | null;
    bodyweightKg: number | null;
    trialStartedAt: string;
    isPro: boolean;
  };
}

/** The changes this phone needs to send to the server. */
export interface SyncPlan {
  uploadWorkouts: Workout[];
  uploadSteps: { stepId: string; doneAt: string }[];
  deleteWorkoutIds: string[];
  deleteStepIds: string[];
  /** Profile fields to write to the server, or null if nothing changed. */
  profileUpdate: { display_name: string | null; bodyweight_kg: number | null } | null;
}

/** True when the phone's data has never been synced to this account before. */
export function isFirstSync(local: AppState, userId: string): boolean {
  return local.ownerId !== userId;
}

/**
 * Wipes everything that belongs to an account (workouts, skills, profile, pending changes)
 * but keeps the trial dates, so signing out or switching accounts can't reset the trial.
 */
export function clearAccountData(local: AppState): AppState {
  return {
    ...local,
    isPro: false,
    workouts: [],
    manualSteps: {},
    profile: { displayName: '' },
    ownerId: undefined,
    pendingWorkoutDeletes: [],
    pendingStepRemovals: [],
  };
}

/**
 * Prepares the phone's data for `userId`. If the local data belongs to a different
 * account, it is cleared so it never gets uploaded into the wrong person's account.
 */
export function prepareForUser(local: AppState, userId: string): AppState {
  return local.ownerId && local.ownerId !== userId ? clearAccountData(local) : local;
}

const trimName = (name: string) => name.trim().slice(0, 30);

export function planSync(local: AppState, remote: RemoteSnapshot, firstSync: boolean): SyncPlan {
  const remoteWorkoutIds = new Set(remote.workouts.map((w) => w.id));
  const pendingDeletes = new Set(local.pendingWorkoutDeletes);
  const pendingRemovals = new Set(local.pendingStepRemovals);

  const localName = trimName(local.profile.displayName);
  const localWeight = local.profile.bodyweightKg ?? null;
  let profileUpdate: SyncPlan['profileUpdate'] = null;
  if (firstSync) {
    // First time on this account: the server's values win, but fill any gaps from the phone.
    const name = remote.profile.displayName?.trim() ? remote.profile.displayName : localName || null;
    const weight = remote.profile.bodyweightKg ?? localWeight;
    if (name !== remote.profile.displayName || weight !== remote.profile.bodyweightKg) {
      profileUpdate = { display_name: name, bodyweight_kg: weight };
    }
  } else if ((localName || null) !== remote.profile.displayName || localWeight !== remote.profile.bodyweightKg) {
    // Already linked: this phone's latest edits win.
    profileUpdate = { display_name: localName || null, bodyweight_kg: localWeight };
  }

  return {
    uploadWorkouts: local.workouts.filter((w) => !remoteWorkoutIds.has(w.id) && !pendingDeletes.has(w.id)),
    uploadSteps: Object.entries(local.manualSteps)
      .filter(([id]) => !(id in remote.steps) && !pendingRemovals.has(id))
      .map(([stepId, doneAt]) => ({ stepId, doneAt })),
    deleteWorkoutIds: local.pendingWorkoutDeletes.filter((id) => remoteWorkoutIds.has(id)),
    deleteStepIds: local.pendingStepRemovals.filter((id) => id in remote.steps),
    profileUpdate,
  };
}

export interface SyncOutcome {
  userId: string;
  firstSync: boolean;
  /** Workout ids whose deletion reached the server (or that were never on it). */
  clearedWorkoutDeletes: string[];
  /** Step ids whose removal reached the server (or that were never on it). */
  clearedStepRemovals: string[];
  /** The profile as it now stands on the server. */
  serverProfile: { displayName: string | null; bodyweightKg: number | null };
}

/**
 * Folds the server's data into the phone's *current* state (which may have changed
 * while the sync was running). Nothing the user did meanwhile is lost: local items
 * are kept, server items are added, and anything still waiting to be deleted stays out.
 */
export function mergeRemote(current: AppState, remote: RemoteSnapshot, outcome: SyncOutcome): AppState {
  const base = prepareForUser(current, outcome.userId);
  const clearedDeletes = new Set(outcome.clearedWorkoutDeletes);
  const clearedRemovals = new Set(outcome.clearedStepRemovals);
  const pendingWorkoutDeletes = base.pendingWorkoutDeletes.filter((id) => !clearedDeletes.has(id));
  const pendingStepRemovals = base.pendingStepRemovals.filter((id) => !clearedRemovals.has(id));
  const stillDeleting = new Set(pendingWorkoutDeletes);
  const stillRemoving = new Set(pendingStepRemovals);

  const byId = new Map<string, Workout>();
  for (const w of remote.workouts) if (!stillDeleting.has(w.id)) byId.set(w.id, w);
  for (const w of base.workouts) byId.set(w.id, w); // the phone's copy wins on a tie
  const workouts = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));

  const manualSteps: Record<string, string> = {};
  for (const [id, at] of Object.entries(remote.steps)) if (!stillRemoving.has(id)) manualSteps[id] = at;
  Object.assign(manualSteps, base.manualSteps);

  let profile: Profile = base.profile;
  if (outcome.firstSync) {
    profile = {
      displayName: outcome.serverProfile.displayName ?? base.profile.displayName,
      bodyweightKg: outcome.serverProfile.bodyweightKg ?? base.profile.bodyweightKg,
    };
  }

  return {
    ...base,
    ownerId: outcome.userId,
    isPro: remote.profile.isPro,
    // The earlier start always wins, so syncing can only shorten a trial, never extend it.
    trialStartedAt: remote.profile.trialStartedAt < base.trialStartedAt ? remote.profile.trialStartedAt : base.trialStartedAt,
    workouts,
    manualSteps,
    profile,
    pendingWorkoutDeletes,
    pendingStepRemovals,
  };
}

/** Converts a database row back into a workout, skipping rows that don't look right. */
export function workoutFromRow(row: { id: string; date: string; entries: unknown; note: string | null }): Workout | null {
  if (!Array.isArray(row.entries)) return null;
  const entries = (row.entries as ExerciseEntry[]).filter((e) => e && typeof e.exerciseId === 'string' && Array.isArray(e.sets));
  const w: Workout = { id: row.id, date: new Date(row.date).toISOString(), entries };
  if (row.note) w.note = row.note;
  return w;
}
