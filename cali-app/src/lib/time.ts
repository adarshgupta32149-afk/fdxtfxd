export type Period = 'morning' | 'afternoon' | 'evening' | 'night';

/** 05–11 morning, 11–17 afternoon, 17–22 evening, 22–05 night. */
export function periodOf(date: Date): Period {
  const h = date.getHours();
  if (h >= 22 || h < 5) return 'night';
  if (h >= 17) return 'evening';
  if (h >= 11) return 'afternoon';
  return 'morning';
}

export const PERIOD_COPY: Record<Period, { label: string; hello: string; kicker: string; title: string }> = {
  morning: { label: 'Morning', hello: 'Good morning', kicker: 'Fresh start', title: 'Get a session in before the day does' },
  afternoon: { label: 'Afternoon', hello: 'Good afternoon', kicker: 'Midday window', title: 'Twenty minutes is enough. Go.' },
  evening: { label: 'Evening', hello: 'Good evening', kicker: 'Ready when you are', title: "Let's get today's session in" },
  night: { label: 'Late night', hello: 'Still up?', kicker: 'Night session?', title: 'Quick 15 minutes, then sleep' },
};

/** Time left until local midnight on the first day of next month. */
export function untilMonthEnd(now: Date): { days: number; hours: number; minutes: number; seconds: number; totalMs: number } {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const totalMs = Math.max(0, end.getTime() - now.getTime());
  const s = Math.floor(totalMs / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, totalMs };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "Thu 5 Nov · 10:41:07 pm" in the viewer's own locale and time zone. */
export function clockLabel(now: Date): string {
  const day = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  return `${day} · ${time}`;
}
