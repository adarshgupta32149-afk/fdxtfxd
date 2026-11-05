import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** One icon per skill, shared by onboarding, Home and the Skills ladder. */
export const SKILL_ICONS: Record<string, IconName> = {
  'muscle-up': 'arrow-up-circle-outline',
  handstand: 'hand-left-outline',
  'front-lever': 'remove-outline',
  planche: 'airplane-outline',
  pistol: 'footsteps-outline',
  'l-sit': 'git-commit-outline',
};

export const skillIcon = (id: string): IconName => SKILL_ICONS[id] ?? 'flash-outline';
