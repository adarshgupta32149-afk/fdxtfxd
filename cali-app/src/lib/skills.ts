import type { Skill } from './types';

/**
 * Progressions from beginner to elite. Steps with a `target` complete themselves
 * from logged sets; steps without one are ticked off by hand.
 */
export const SKILLS: Skill[] = [
  {
    id: 'muscle-up',
    name: 'Muscle-up',
    tagline: 'From dead hang to over the bar',
    steps: [
      { id: 'mu-1', name: 'Dead hang 30s', description: 'Build grip and shoulder strength.', target: { exerciseId: 'dead-hang', holdSec: 30 } },
      { id: 'mu-2', name: '10 Australian rows', description: 'Horizontal pulling base.', target: { exerciseId: 'australian-row', reps: 10 } },
      { id: 'mu-3', name: 'First pull-up', description: 'The big one. Chin over the bar.', target: { exerciseId: 'pull-up', reps: 1 } },
      { id: 'mu-4', name: '5 pull-ups', description: 'Strict, full range.', target: { exerciseId: 'pull-up', reps: 5 } },
      { id: 'mu-5', name: '10 pull-ups', description: 'The muscle-up entry ticket.', target: { exerciseId: 'pull-up', reps: 10 } },
      { id: 'mu-6', name: 'Chest-to-bar pull-ups', description: 'Pull explosively until your chest touches the bar.' },
      { id: 'mu-7', name: '10 straight bar dips', description: 'Strength for the top of the muscle-up.', target: { exerciseId: 'straight-bar-dip', reps: 10 } },
      { id: 'mu-8', name: 'First muscle-up', description: 'Pull, transition, press out.', target: { exerciseId: 'muscle-up', reps: 1 } },
      { id: 'mu-9', name: 'Weighted muscle-up +10kg', description: 'Elite territory.', target: { exerciseId: 'muscle-up', reps: 1, kg: 10 } },
    ],
  },
  {
    id: 'handstand',
    name: 'Handstand',
    tagline: 'Balance on your hands',
    steps: [
      { id: 'hs-1', name: 'Plank 60s', description: 'Full-body tension.', target: { exerciseId: 'plank', holdSec: 60 } },
      { id: 'hs-2', name: '10 pike push-ups', description: 'Overhead pressing strength.', target: { exerciseId: 'pike-push-up', reps: 10 } },
      { id: 'hs-3', name: 'Wall handstand 30s', description: 'Chest to wall, straight line.', target: { exerciseId: 'wall-handstand', holdSec: 30 } },
      { id: 'hs-4', name: 'Freestanding 10s', description: 'Off the wall for the first time.', target: { exerciseId: 'handstand', holdSec: 10 } },
      { id: 'hs-5', name: 'Freestanding 30s', description: 'Consistent balance.', target: { exerciseId: 'handstand', holdSec: 30 } },
      { id: 'hs-6', name: 'First handstand push-up', description: 'Press from head to lockout.', target: { exerciseId: 'handstand-push-up', reps: 1 } },
      { id: 'hs-7', name: 'One-arm handstand', description: 'The final boss.' },
    ],
  },
  {
    id: 'front-lever',
    name: 'Front lever',
    tagline: 'Horizontal under the bar',
    steps: [
      { id: 'fl-1', name: '10 hanging leg raises', description: 'Core and lat control.', target: { exerciseId: 'hanging-leg-raise', reps: 10 } },
      { id: 'fl-2', name: 'Tuck front lever 10s', description: 'Knees to chest, back flat.', target: { exerciseId: 'tuck-front-lever', holdSec: 10 } },
      { id: 'fl-3', name: 'Tuck front lever 20s', description: 'Own the tuck.', target: { exerciseId: 'tuck-front-lever', holdSec: 20 } },
      { id: 'fl-4', name: 'Full front lever 3s', description: 'Legs straight, body flat.', target: { exerciseId: 'front-lever', holdSec: 3 } },
      { id: 'fl-5', name: 'Full front lever 10s', description: 'Advanced strength.', target: { exerciseId: 'front-lever', holdSec: 10 } },
    ],
  },
  {
    id: 'planche',
    name: 'Planche',
    tagline: 'Float above the ground',
    steps: [
      { id: 'pl-1', name: 'Plank 60s', description: 'The foundation.', target: { exerciseId: 'plank', holdSec: 60 } },
      { id: 'pl-2', name: 'Planche lean 20s', description: 'Shoulders past your hands.' },
      { id: 'pl-3', name: 'Tuck planche 10s', description: 'Feet off the ground.', target: { exerciseId: 'tuck-planche', holdSec: 10 } },
      { id: 'pl-4', name: 'Full planche 3s', description: 'One of the hardest skills in calisthenics.', target: { exerciseId: 'planche', holdSec: 3 } },
    ],
  },
  {
    id: 'pistol',
    name: 'Pistol squat',
    tagline: 'One-leg strength',
    steps: [
      { id: 'ps-1', name: '20 bodyweight squats', description: 'Full depth.', target: { exerciseId: 'squat', reps: 20 } },
      { id: 'ps-2', name: 'Assisted pistol', description: 'Hold a pole or band for balance.' },
      { id: 'ps-3', name: 'First pistol squat', description: 'Unassisted, each leg.', target: { exerciseId: 'pistol-squat', reps: 1 } },
      { id: 'ps-4', name: '10 pistol squats', description: 'Each leg.', target: { exerciseId: 'pistol-squat', reps: 10 } },
    ],
  },
  {
    id: 'l-sit',
    name: 'L-sit',
    tagline: 'Compression and core',
    steps: [
      { id: 'ls-1', name: 'L-sit 10s', description: 'Legs straight, parallel to the floor.', target: { exerciseId: 'l-sit', holdSec: 10 } },
      { id: 'ls-2', name: 'L-sit 20s', description: 'Locked arms, no sagging.', target: { exerciseId: 'l-sit', holdSec: 20 } },
      { id: 'ls-3', name: 'L-sit 30s', description: 'Solid compression strength.', target: { exerciseId: 'l-sit', holdSec: 30 } },
    ],
  },
];
