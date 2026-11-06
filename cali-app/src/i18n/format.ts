import type { Board } from '@/lib/boards';

import type { Key } from './en';

type T = (key: Key, vars?: Record<string, string | number>) => string;

/** A leaderboard value in the app language: "12 reps", "+20 kg", "45 s". */
export function boardValue(t: T, board: Board, v: number): string {
  if (board.id === 'weighted_pull_up_kg') return t('unitFmt.plusKg', { n: v });
  if (board.id === 'handstand_hold_sec') return t('unitFmt.sec', { n: v });
  return t('count.reps', { count: v });
}
