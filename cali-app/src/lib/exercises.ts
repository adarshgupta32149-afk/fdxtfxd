import type { Exercise, ExerciseCategory } from './types';

export const EXERCISES: Exercise[] = [
  // Pull
  { id: 'pull-up', name: 'Pull-up', category: 'pull', kind: 'reps', allowsWeight: true },
  { id: 'chin-up', name: 'Chin-up', category: 'pull', kind: 'reps', allowsWeight: true },
  { id: 'australian-row', name: 'Australian row', category: 'pull', kind: 'reps', allowsWeight: false },
  { id: 'dead-hang', name: 'Dead hang', category: 'pull', kind: 'hold', allowsWeight: true },
  // Push
  { id: 'push-up', name: 'Push-up', category: 'push', kind: 'reps', allowsWeight: true },
  { id: 'archer-push-up', name: 'Archer push-up', category: 'push', kind: 'reps', allowsWeight: false },
  { id: 'pike-push-up', name: 'Pike push-up', category: 'push', kind: 'reps', allowsWeight: false },
  { id: 'dip', name: 'Dip', category: 'push', kind: 'reps', allowsWeight: true },
  { id: 'straight-bar-dip', name: 'Straight bar dip', category: 'push', kind: 'reps', allowsWeight: true },
  { id: 'handstand-push-up', name: 'Handstand push-up', category: 'push', kind: 'reps', allowsWeight: false },
  // Legs
  { id: 'squat', name: 'Bodyweight squat', category: 'legs', kind: 'reps', allowsWeight: false },
  { id: 'pistol-squat', name: 'Pistol squat', category: 'legs', kind: 'reps', allowsWeight: true },
  // Core
  { id: 'plank', name: 'Plank', category: 'core', kind: 'hold', allowsWeight: false },
  { id: 'hanging-leg-raise', name: 'Hanging leg raise', category: 'core', kind: 'reps', allowsWeight: false },
  { id: 'l-sit', name: 'L-sit', category: 'core', kind: 'hold', allowsWeight: false },
  // Skills
  { id: 'muscle-up', name: 'Muscle-up', category: 'skill', kind: 'reps', allowsWeight: true },
  { id: 'wall-handstand', name: 'Wall handstand', category: 'skill', kind: 'hold', allowsWeight: false },
  { id: 'handstand', name: 'Freestanding handstand', category: 'skill', kind: 'hold', allowsWeight: false },
  { id: 'tuck-front-lever', name: 'Tuck front lever', category: 'skill', kind: 'hold', allowsWeight: false },
  { id: 'front-lever', name: 'Front lever', category: 'skill', kind: 'hold', allowsWeight: false },
  { id: 'tuck-planche', name: 'Tuck planche', category: 'skill', kind: 'hold', allowsWeight: false },
  { id: 'planche', name: 'Planche', category: 'skill', kind: 'hold', allowsWeight: false },
  // Lifts (for lifters crossing over)
  { id: 'bench-press', name: 'Bench press', category: 'lift', kind: 'reps', allowsWeight: true },
  { id: 'back-squat', name: 'Back squat', category: 'lift', kind: 'reps', allowsWeight: true },
  { id: 'deadlift', name: 'Deadlift', category: 'lift', kind: 'reps', allowsWeight: true },
  { id: 'overhead-press', name: 'Overhead press', category: 'lift', kind: 'reps', allowsWeight: true },
  { id: 'barbell-row', name: 'Barbell row', category: 'lift', kind: 'reps', allowsWeight: true },
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  pull: 'Pull',
  push: 'Push',
  legs: 'Legs',
  core: 'Core',
  skill: 'Skills',
  lift: 'Lifts',
};

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}
