import type { AppState } from './types';

export const TRIAL_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AccessStatus = 'pro' | 'trial' | 'expired';

export interface Access {
  status: AccessStatus;
  /** Whether new workouts and skill check-offs are allowed. History is always viewable. */
  canLog: boolean;
  /** Whole days of trial remaining (0 once expired). */
  daysLeft: number;
  trialEndsAt: string;
}

/**
 * Works out what the user may do. The clock is never allowed to run backwards:
 * if the phone's date is earlier than the last time the app was opened, the
 * later date wins, so moving the clock back does not extend the trial.
 *
 * NOTE: this is a client-side check only. Reinstalling the app resets local
 * storage, so once accounts exist the trial start must also be stored on the server.
 */
export function getAccess(state: Pick<AppState, 'isPro' | 'trialStartedAt' | 'lastSeenAt'>, now: Date): Access {
  const start = new Date(state.trialStartedAt).getTime();
  const lastSeen = new Date(state.lastSeenAt).getTime();
  const effectiveNow = Math.max(now.getTime(), Number.isNaN(lastSeen) ? 0 : lastSeen);
  const end = start + TRIAL_DAYS * DAY_MS;
  const daysLeft = Math.max(0, Math.ceil((end - effectiveNow) / DAY_MS));
  const trialEndsAt = new Date(end).toISOString();

  if (state.isPro) return { status: 'pro', canLog: true, daysLeft, trialEndsAt };
  if (effectiveNow < end) return { status: 'trial', canLog: true, daysLeft, trialEndsAt };
  return { status: 'expired', canLog: false, daysLeft: 0, trialEndsAt };
}
