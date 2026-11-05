export type ExerciseCategory = 'pull' | 'push' | 'legs' | 'core' | 'skill' | 'lift';

/** `reps` exercises are counted, `hold` exercises are timed in seconds. */
export type ExerciseKind = 'reps' | 'hold';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  kind: ExerciseKind;
  /** Bodyweight moves can carry added weight (belt/vest); lifts always use load. */
  allowsWeight: boolean;
}

export interface SetEntry {
  reps?: number;
  holdSec?: number;
  /** Added weight for bodyweight moves, bar/dumbbell load for lifts. */
  kg?: number;
}

export interface ExerciseEntry {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  /** ISO timestamp of when the workout was logged. */
  date: string;
  entries: ExerciseEntry[];
  note?: string;
}

/** A measurable goal that can be checked automatically against logged sets. */
export interface StepTarget {
  exerciseId: string;
  reps?: number;
  holdSec?: number;
  kg?: number;
}

export interface SkillStep {
  id: string;
  name: string;
  description: string;
  /** If present, the step completes itself once a logged set meets the target. */
  target?: StepTarget;
}

export interface Skill {
  id: string;
  name: string;
  tagline: string;
  steps: SkillStep[];
}

export interface Profile {
  displayName: string;
  bodyweightKg?: number;
}

export interface AppState {
  version: 1;
  /** ISO timestamp of the first launch; starts the free trial. */
  trialStartedAt: string;
  /** Latest time the app was opened; stops the trial being extended by moving the phone clock back. */
  lastSeenAt: string;
  isPro: boolean;
  workouts: Workout[];
  /** Skill steps the user ticked off by hand, keyed by step id, valued by ISO date. */
  manualSteps: Record<string, string>;
  profile: Profile;
}
