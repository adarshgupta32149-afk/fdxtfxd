import type { AppState, Workout } from './types';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createInitialState(now: Date): AppState {
  const iso = now.toISOString();
  return {
    version: 1,
    trialStartedAt: iso,
    lastSeenAt: iso,
    isPro: false,
    workouts: [],
    manualSteps: {},
    profile: { displayName: '' },
    pendingWorkoutDeletes: [],
    pendingStepRemovals: [],
  };
}

const stringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

/** Records that the app was opened now, never moving `lastSeenAt` backwards. */
export function touchLastSeen(state: AppState, now: Date): AppState {
  return now.toISOString() > state.lastSeenAt ? { ...state, lastSeenAt: now.toISOString() } : state;
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

/**
 * Turns whatever was in storage back into a valid state. Anything missing or
 * corrupted falls back to safe defaults instead of crashing the app. A broken
 * trial date falls back to the earliest date we still know about, so corrupting
 * it can't hand out a fresh 60-day trial.
 */
export function parseState(raw: string | null, now: Date): AppState {
  const fresh = createInitialState(now);
  if (!raw) return fresh;
  let data: Partial<AppState>;
  try {
    data = JSON.parse(raw);
  } catch {
    return fresh;
  }
  if (!data || typeof data !== 'object') return fresh;
  const workouts: Workout[] = Array.isArray(data.workouts)
    ? data.workouts.filter((w) => w && isValidDate(w.date) && Array.isArray(w.entries))
    : [];
  const knownDates = [data.lastSeenAt, ...workouts.map((w) => w.date)].filter(isValidDate).sort();
  return {
    version: 1,
    trialStartedAt: isValidDate(data.trialStartedAt) ? data.trialStartedAt : (knownDates[0] ?? fresh.trialStartedAt),
    lastSeenAt: isValidDate(data.lastSeenAt) ? data.lastSeenAt : fresh.lastSeenAt,
    isPro: data.isPro === true,
    workouts,
    manualSteps: data.manualSteps && typeof data.manualSteps === 'object' ? data.manualSteps : {},
    profile: {
      displayName: typeof data.profile?.displayName === 'string' ? data.profile.displayName : '',
      bodyweightKg: typeof data.profile?.bodyweightKg === 'number' ? data.profile.bodyweightKg : undefined,
    },
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
    pendingWorkoutDeletes: stringArray(data.pendingWorkoutDeletes),
    pendingStepRemovals: stringArray(data.pendingStepRemovals),
  };
}
