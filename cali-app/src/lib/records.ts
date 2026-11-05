import { getExercise } from './exercises';
import { SKILLS } from './skills';
import type { AppState, SetEntry, Skill, SkillStep, StepTarget, Workout } from './types';

export interface ExerciseRecord {
  exerciseId: string;
  /** Most reps in a single set. */
  maxReps?: number;
  /** Longest hold in seconds. */
  maxHoldSec?: number;
  /** Heaviest load (added weight or bar load) used in any set. */
  maxKg?: number;
  /** Estimated one-rep max (Epley), lifts only. */
  est1RM?: number;
  /** ISO date of the most recent set for this exercise. */
  lastDate: string;
}

/** Epley estimate, rounded to the nearest 0.5kg. */
export function estimateOneRepMax(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0;
  const raw = reps === 1 ? kg : kg * (1 + reps / 30);
  return Math.round(raw * 2) / 2;
}

function maxOf(current: number | undefined, value: number | undefined): number | undefined {
  if (value === undefined || value <= 0) return current;
  return current === undefined ? value : Math.max(current, value);
}

export function computeRecords(workouts: Workout[]): Record<string, ExerciseRecord> {
  const records: Record<string, ExerciseRecord> = {};
  for (const workout of workouts) {
    for (const entry of workout.entries) {
      const exercise = getExercise(entry.exerciseId);
      for (const set of entry.sets) {
        const rec = (records[entry.exerciseId] ??= { exerciseId: entry.exerciseId, lastDate: workout.date });
        if (workout.date > rec.lastDate) rec.lastDate = workout.date;
        rec.maxReps = maxOf(rec.maxReps, set.reps);
        rec.maxHoldSec = maxOf(rec.maxHoldSec, set.holdSec);
        rec.maxKg = maxOf(rec.maxKg, set.kg);
        if (exercise?.category === 'lift' && set.kg && set.reps) {
          rec.est1RM = maxOf(rec.est1RM, estimateOneRepMax(set.kg, set.reps));
        }
      }
    }
  }
  return records;
}

export function setMeetsTarget(set: SetEntry, target: StepTarget): boolean {
  if (target.reps !== undefined && (set.reps ?? 0) < target.reps) return false;
  if (target.holdSec !== undefined && (set.holdSec ?? 0) < target.holdSec) return false;
  if (target.kg !== undefined && (set.kg ?? 0) < target.kg) return false;
  return target.reps !== undefined || target.holdSec !== undefined || target.kg !== undefined;
}

/** Steps finished either by hand or automatically from logged sets. */
export function completedStepIds(state: Pick<AppState, 'workouts' | 'manualSteps'>, skills: Skill[] = SKILLS): Set<string> {
  const done = new Set(Object.keys(state.manualSteps));
  const setsByExercise = new Map<string, SetEntry[]>();
  for (const workout of state.workouts) {
    for (const entry of workout.entries) {
      const list = setsByExercise.get(entry.exerciseId) ?? [];
      list.push(...entry.sets);
      setsByExercise.set(entry.exerciseId, list);
    }
  }
  for (const skill of skills) {
    for (const step of skill.steps) {
      if (!step.target || done.has(step.id)) continue;
      const sets = setsByExercise.get(step.target.exerciseId) ?? [];
      if (sets.some((s) => setMeetsTarget(s, step.target!))) done.add(step.id);
    }
  }
  return done;
}

export interface SkillProgress {
  done: number;
  total: number;
  nextStep?: SkillStep;
}

export function skillProgress(skill: Skill, completed: Set<string>): SkillProgress {
  const done = skill.steps.filter((s) => completed.has(s.id)).length;
  return { done, total: skill.steps.length, nextStep: skill.steps.find((s) => !completed.has(s.id)) };
}

/** Workouts since Monday 00:00 local time of the week containing `now`. */
export function workoutsThisWeek(workouts: Workout[], now: Date): Workout[] {
  const start = new Date(now);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);
  return workouts.filter((w) => new Date(w.date) >= start && new Date(w.date) <= now);
}

export function countSets(workouts: Workout[]): number {
  return workouts.reduce((n, w) => n + w.entries.reduce((m, e) => m + e.sets.length, 0), 0);
}

export function formatSet(set: SetEntry): string {
  const main = set.holdSec !== undefined ? `${set.holdSec}s` : `${set.reps ?? 0} reps`;
  return set.kg ? `${main} @ ${set.kg}kg` : main;
}
