import type { ExerciseRecord } from './records';

/** Leaderboard categories. `id` matches the `board` values the database accepts. */
export type BoardId = 'max_pull_ups' | 'max_muscle_ups' | 'weighted_pull_up_kg' | 'handstand_hold_sec';

export interface Board {
  id: BoardId;
  label: string;
  short: string;
  exerciseId: string;
  /** Formats a score for display. */
  unit: (v: number) => string;
  /** Reads your own best for this board from your records. */
  mine: (r?: ExerciseRecord) => number | undefined;
}

export const BOARDS: Board[] = [
  { id: 'max_pull_ups', label: 'Max pull-ups', short: 'Pull-ups', exerciseId: 'pull-up', unit: (v) => `${v} reps`, mine: (r) => r?.maxReps },
  { id: 'max_muscle_ups', label: 'Max muscle-ups', short: 'Muscle-ups', exerciseId: 'muscle-up', unit: (v) => `${v} reps`, mine: (r) => r?.maxReps },
  { id: 'weighted_pull_up_kg', label: 'Heaviest pull-up', short: 'Weighted', exerciseId: 'pull-up', unit: (v) => `+${v}kg`, mine: (r) => r?.maxKg },
  { id: 'handstand_hold_sec', label: 'Longest handstand', short: 'Handstand', exerciseId: 'handstand', unit: (v) => `${v}s`, mine: (r) => r?.maxHoldSec },
];

export interface BoardRow {
  rank: number;
  display_name: string;
  value: number;
}

/** The monthly challenge cycles through the boards so every discipline gets a month. */
export function challengeFor(date: Date): Board {
  return BOARDS[date.getMonth() % BOARDS.length];
}
