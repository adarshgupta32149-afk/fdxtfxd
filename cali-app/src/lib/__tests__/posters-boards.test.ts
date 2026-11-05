import { describe, expect, it } from 'vitest';
import { BOARDS, challengeFor } from '../boards';
import { postersFor, SAMPLE_POSTERS, type Poster } from '../posters';

describe('postersFor', () => {
  it('shows only posters for the current part of the day', () => {
    expect(postersFor('night').every((p) => p.period === 'night')).toBe(true);
    expect(postersFor('morning').length).toBeGreaterThan(0);
  });
  it("includes 'any' posters alongside the period's own", () => {
    const list: Poster[] = [...SAMPLE_POSTERS, { id: 'x', period: 'any', tone: 'frost', lines: ['Hi'], caption: '', mark: '' }];
    expect(postersFor('evening', list).map((p) => p.id)).toContain('x');
  });
  it('falls back to everything rather than showing an empty slot', () => {
    const onlyNight: Poster[] = [{ id: 'n', period: 'night', tone: 'navy', lines: ['N'], caption: '', mark: '' }];
    expect(postersFor('morning', onlyNight)).toEqual(onlyNight);
  });
});

describe('challengeFor', () => {
  it('rotates through every board across the year', () => {
    const ids = new Set(Array.from({ length: 12 }, (_, m) => challengeFor(new Date(2026, m, 15)).id));
    expect(ids.size).toBe(BOARDS.length);
  });
});
