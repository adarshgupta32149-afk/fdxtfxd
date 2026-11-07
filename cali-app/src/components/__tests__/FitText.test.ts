import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' }, StyleSheet: { flatten: (s: unknown) => s }, Text: () => null }));

const { brokeMidWord, fitScale, unbreakableUnits } = await import('../FitText');

describe('FitText helpers', () => {
  it('splits spaced scripts into words and keeps unspaced lines whole', () => {
    expect(unbreakableUnits('Train skills.\nEarn your\nrank.')).toEqual(['Train', 'skills.', 'Earn', 'your', 'rank.']);
    expect(unbreakableUnits('技を磨け。\nランクを\nつかめ。')).toEqual(['技を磨け。', 'ランクを', 'つかめ。']);
    expect(unbreakableUnits('திறன்களைக் கற்று.')).toEqual(['திறன்களைக்', 'கற்று.']);
  });

  it('shrinks only as much as needed, within the floor', () => {
    expect(fitScale(300, 342, 0.5)).toBe(1);
    expect(fitScale(388, 342, 0.5)).toBe(0.88);
    expect(fitScale(2000, 342, 0.5)).toBe(0.5);
  });

  it('spots a line that ends inside a word', () => {
    expect(brokeMidWord(['Train ', 'skills.\n', 'rank.'])).toBe(false);
    expect(brokeMidWord(['képesség', 'eidet.'])).toBe(true);
  });
});
