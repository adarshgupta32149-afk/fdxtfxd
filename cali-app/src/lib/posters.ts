import type { Period } from './time';

export type PosterTone = 'frost' | 'navy' | 'ink' | 'gold' | 'ember';

export interface Poster {
  id: string;
  /** Which part of the day it shows in; 'any' shows all day. */
  period: Period | 'any';
  /** A 4:3 image (1200×900 recommended). When missing, the text design below is shown. */
  imageUrl?: string;
  tone: PosterTone;
  /** Headline, one line per array item. */
  lines: string[];
  caption: string;
  /** Big faded mark in the corner. */
  mark: string;
  /** True for the placeholder posters that ship with the app. */
  sample?: boolean;
}

/** Placeholder posters until weekly uploads exist. All original lines. */
export const SAMPLE_POSTERS: Poster[] = [
  { id: 's-m1', period: 'morning', tone: 'frost', lines: ['Coffee', 'then', 'pull-ups'], caption: 'In that order. Every time.', mark: 'AM', sample: true },
  { id: 's-m2', period: 'morning', tone: 'ink', lines: ['Morning', 'sets', 'count double'], caption: "They don't. Go anyway.", mark: '6:00', sample: true },
  { id: 's-a1', period: 'afternoon', tone: 'navy', lines: ['Lunch break.', 'Push-up', 'break.'], caption: 'Pick both.', mark: '1PM', sample: true },
  { id: 's-a2', period: 'afternoon', tone: 'gold', lines: ['3 PM slump', 'vs', '3 sets'], caption: 'One of these feels better after.', mark: '3×', sample: true },
  { id: 's-e1', period: 'evening', tone: 'ink', lines: ['Clocked out.', 'Clocking', 'reps.'], caption: 'The office is done. You are not.', mark: 'PM', sample: true },
  { id: 's-e2', period: 'evening', tone: 'ember', lines: ['Golden hour', 'is bar', 'hour'], caption: 'Best light for form checks.', mark: '17', sample: true },
  { id: 's-n1', period: 'night', tone: 'navy', lines: ['Gains', 'happen', 'asleep'], caption: 'So go to sleep.', mark: 'Zz', sample: true },
  { id: 's-n2', period: 'night', tone: 'gold', lines: ['11 PM', 'pull-ups', 'hit different'], caption: 'Your neighbours disagree.', mark: '11', sample: true },
  { id: 's-n3', period: 'night', tone: 'ink', lines: ['One more rep,', 'said', 'no one'], caption: 'At this hour, anyway.', mark: '+1', sample: true },
];

/** Posters for the current part of the day, falling back to everything if none are tagged for it. */
export function postersFor(period: Period, all: Poster[] = SAMPLE_POSTERS): Poster[] {
  const matching = all.filter((p) => p.period === period || p.period === 'any');
  return matching.length ? matching : all;
}
