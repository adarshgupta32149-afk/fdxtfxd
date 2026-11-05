/**
 * Deep navy × frosted matte white, with one warm accent.
 * The whites are sampled from the frosted-glass reference: never pure white, so nothing glares.
 * Ember is the only colour accent: used for "live" and competition moments, never as decoration.
 */
export const colors = {
  bg: '#070B16',
  /** Glass panel fill and edge (translucent frosted white over the navy glow). */
  card: 'rgba(228,228,230,0.06)',
  cardRaised: 'rgba(228,228,230,0.10)',
  border: 'rgba(228,228,230,0.12)',
  /** Solid navy for things that sit on frost (button on the hero, tab bar). */
  navy: '#0B1324',
  navyPanel: '#0E1424',
  drawer: '#0B1122',
  text: '#E4E4E6',
  muted: '#8790A6',
  faint: '#5E6782',
  /** Frosted matte white: highlight, light area, soft shadow. */
  frostHi: '#ECECEC',
  frost: '#D9D9D9',
  frostLo: '#C6C6CA',
  /** Text and icons placed on frost. */
  onFrost: '#0B1324',
  onFrostMuted: '#4A5163',
  // Kept for existing call sites: the accent is the frost white.
  accent: '#D9D9D9',
  accentInk: '#0B1324',
  /** Warm accent for live states, countdowns and competition. */
  ember: '#FF9A62',
  emberSoft: 'rgba(255,154,98,0.14)',
  /** Used sparingly: Pro badge and leaderboard ranks. */
  gold: '#E3D3A6',
  live: '#9FE3B7',
  danger: '#F2A1A1',
  dangerFill: 'rgba(242,161,161,0.08)',
  blue: '#9DB4EA',
};

/** The frost gradient, from top-left light to bottom-right soft shadow. */
export const frostGradient = [colors.frostHi, '#DCDCDD', colors.frostLo] as const;

/** Body text: Manrope. Display (titles, numbers): Barlow Condensed. */
export const font = 'Manrope';
export const display = 'BarlowCondensed';

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Room to leave at the bottom of tab screens so content clears the floating tab bar. */
export const TAB_BAR_SPACE = 120;
