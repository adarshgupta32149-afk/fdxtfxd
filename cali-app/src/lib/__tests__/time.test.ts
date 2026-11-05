import { describe, expect, it } from 'vitest';
import { pad2, periodOf, untilMonthEnd } from '../time';

const at = (h: number, m = 0) => new Date(2026, 10, 5, h, m);

describe('periodOf', () => {
  it('maps hours to the right part of the day', () => {
    expect(periodOf(at(4, 59))).toBe('night');
    expect(periodOf(at(5))).toBe('morning');
    expect(periodOf(at(10, 59))).toBe('morning');
    expect(periodOf(at(11))).toBe('afternoon');
    expect(periodOf(at(17))).toBe('evening');
    expect(periodOf(at(21, 59))).toBe('evening');
    expect(periodOf(at(22))).toBe('night');
    expect(periodOf(at(0))).toBe('night');
  });
});

describe('untilMonthEnd', () => {
  it('counts down to midnight on the 1st of next month', () => {
    const left = untilMonthEnd(new Date(2026, 10, 30, 23, 59, 30)); // 30 Nov, 23:59:30
    expect(left).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 30 });
  });
  it('rolls over the year in December', () => {
    const left = untilMonthEnd(new Date(2026, 11, 31, 0, 0, 0));
    expect(left.days).toBe(1);
    expect(left.hours).toBe(0);
  });
  it('never goes negative', () => {
    expect(untilMonthEnd(new Date(2026, 11, 1, 0, 0, 0)).totalMs).toBeGreaterThan(0);
  });
});

describe('pad2', () => {
  it('zero-pads single digits', () => {
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
  });
});
