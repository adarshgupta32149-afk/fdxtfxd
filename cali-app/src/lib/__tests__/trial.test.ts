import { describe, expect, it } from 'vitest';
import { getAccess, TRIAL_DAYS } from '../trial';

const DAY = 24 * 60 * 60 * 1000;
const start = new Date('2026-01-01T10:00:00.000Z');
const at = (days: number) => new Date(start.getTime() + days * DAY);
const state = (over: Partial<{ isPro: boolean; lastSeenAt: string }> = {}) => ({
  isPro: false,
  trialStartedAt: start.toISOString(),
  lastSeenAt: start.toISOString(),
  ...over,
});

describe('getAccess', () => {
  it('gives a full trial on day one', () => {
    const a = getAccess(state(), start);
    expect(a.status).toBe('trial');
    expect(a.canLog).toBe(true);
    expect(a.daysLeft).toBe(TRIAL_DAYS);
  });

  it('counts down and still allows logging on the last day', () => {
    const a = getAccess(state(), at(59.5));
    expect(a.status).toBe('trial');
    expect(a.canLog).toBe(true);
    expect(a.daysLeft).toBe(1);
  });

  it('locks logging once 60 days have passed', () => {
    const a = getAccess(state(), at(60));
    expect(a.status).toBe('expired');
    expect(a.canLog).toBe(false);
    expect(a.daysLeft).toBe(0);
  });

  it('never locks a Pro user', () => {
    const a = getAccess(state({ isPro: true }), at(400));
    expect(a.status).toBe('pro');
    expect(a.canLog).toBe(true);
  });

  it('ignores the phone clock being moved backwards', () => {
    const lastSeen = at(70).toISOString();
    const a = getAccess(state({ lastSeenAt: lastSeen }), at(10));
    expect(a.status).toBe('expired');
    expect(a.canLog).toBe(false);
  });
});
