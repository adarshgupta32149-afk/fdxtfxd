/**
 * Deep navy × frosted matte white.
 * The whites are sampled from the frosted-glass reference: never pure white, so nothing glares.
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
  // Kept for existing call sites: the accent is now the frost white.
  accent: '#D9D9D9',
  accentInk: '#0B1324',
  /** Used sparingly: Pro badge and leaderboard ranks. */
  gold: '#E3D3A6',
  danger: '#F2A1A1',
  dangerFill: 'rgba(242,161,161,0.08)',
  blue: '#9DB4EA',
};

/** The frost gradient, from top-left light to bottom-right soft shadow. */
export const frostGradient = [colors.frostHi, '#DCDCDD', colors.frostLo] as const;

export const font = 'Inter';
export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
