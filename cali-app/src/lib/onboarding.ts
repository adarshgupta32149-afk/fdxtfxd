/** Answers from the welcome flow's "where are you now?" step. */
export type PullUpLevel = 'none' | '1-4' | '5-9' | '10+';
export type HandstandLevel = 'none' | 'wall-short' | 'wall-30';

export interface Placement {
  pullUps: PullUpLevel;
  handstand: HandstandLevel;
}

export const PULL_UP_OPTIONS: { value: PullUpLevel; label: string }[] = [
  { value: 'none', label: 'Not yet' },
  { value: '1-4', label: '1–4' },
  { value: '5-9', label: '5–9' },
  { value: '10+', label: '10+' },
];

export const HANDSTAND_OPTIONS: { value: HandstandLevel; label: string }[] = [
  { value: 'none', label: 'Not yet' },
  { value: 'wall-short', label: 'Against a wall, briefly' },
  { value: 'wall-30', label: 'Wall, 30s or more' },
];

/**
 * Skill steps someone has already earned, based on their answers, so they start at their real level
 * instead of being told to do dead hangs when they can already do ten pull-ups.
 */
export function placementSteps(p: Placement): string[] {
  const steps: string[] = [];
  const pull = { none: 0, '1-4': 1, '5-9': 2, '10+': 3 }[p.pullUps];
  if (pull >= 1) steps.push('mu-1', 'mu-2', 'mu-3');
  if (pull >= 2) steps.push('mu-4', 'fl-1');
  if (pull >= 3) steps.push('mu-5');
  const hs = { none: 0, 'wall-short': 1, 'wall-30': 2 }[p.handstand];
  if (hs >= 1) steps.push('hs-1', 'hs-2', 'pl-1');
  if (hs >= 2) steps.push('hs-3');
  return steps;
}
