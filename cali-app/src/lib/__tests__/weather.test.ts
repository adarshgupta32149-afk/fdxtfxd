import { describe, expect, it } from 'vitest';

import { describeWeather, isStale, localTimeAt, parseWeather, placeName, placeUrl, to12h, trainingTip, weatherUrl, type Weather } from '../weather';

const now = new Date('2026-11-06T12:30:00Z');

// Shape of a real Open-Meteo forecast response (trimmed).
const sample = {
  latitude: 19.07,
  longitude: 72.88,
  utc_offset_seconds: 19800,
  timezone: 'Asia/Kolkata',
  timezone_abbreviation: 'GMT+5:30',
  current: { time: '2026-11-06T18:00', interval: 900, temperature_2m: 29.4, apparent_temperature: 33.1, relative_humidity_2m: 68, weather_code: 2, wind_speed_10m: 11.2, is_day: 1 },
  daily: { time: ['2026-11-06'], sunrise: ['2026-11-06T06:36'], sunset: ['2026-11-06T18:04'], uv_index_max: [7.2] },
};

const w = (over: Partial<Weather> = {}): Weather => ({ ...(parseWeather(sample, now) as { ok: true; weather: Weather }).weather, ...over });

describe('weather parsing', () => {
  it('reads the fields we show', () => {
    const r = parseWeather(sample, now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.weather).toMatchObject({ tempC: 29.4, feelsC: 33.1, humidity: 68, code: 2, isDay: true, timezone: 'Asia/Kolkata', utcOffsetSec: 19800, sunrise: '06:36', sunset: '18:04', uvMax: 7.2 });
  });
  it('passes on the service error message, e.g. rate limits', () => {
    const r = parseWeather({ error: true, reason: 'Daily API request limit exceeded. Please try again tomorrow.' }, now);
    expect(r).toEqual({ ok: false, reason: 'Daily API request limit exceeded. Please try again tomorrow.' });
  });
  it('refuses incomplete data', () => {
    expect(parseWeather({ current: {} }, now).ok).toBe(false);
    expect(parseWeather(null, now).ok).toBe(false);
  });
  it('builds request URLs', () => {
    expect(weatherUrl(19.0761, 72.8781)).toContain('latitude=19.076&longitude=72.878');
    expect(weatherUrl(1, 2)).toContain('timezone=auto');
    expect(placeUrl(19.07, 72.88)).toContain('latitude=19.0700');
  });
});

describe('descriptions and tips', () => {
  it('maps WMO codes', () => {
    expect(describeWeather(0, true)).toEqual({ label: 'Clear', icon: 'sunny' });
    expect(describeWeather(0, false).icon).toBe('moon');
    expect(describeWeather(63, true).label).toBe('Rain');
    expect(describeWeather(81, true).label).toBe('Showers');
    expect(describeWeather(95, true).icon).toBe('thunderstorm');
    expect(describeWeather(73, true).label).toBe('Snow');
  });
  it('gives the most important tip first', () => {
    expect(trainingTip(w({ code: 95 }))).toContain('Thunderstorm');
    expect(trainingTip(w({ code: 61 }))).toContain('slippery');
    expect(trainingTip(w({ feelsC: 36 }))).toContain('Very hot');
    expect(trainingTip(w({ feelsC: 31 }))).toContain('Hot out');
    expect(trainingTip(w({ feelsC: 3 }))).toContain('Cold');
    expect(trainingTip(w({ feelsC: 22, uvMax: 9 }))).toContain('UV');
    expect(trainingTip(w({ feelsC: 22, uvMax: 3, windKmh: 40 }))).toContain('Windy');
    expect(trainingTip(w({ feelsC: 22, uvMax: 3, windKmh: 5 }))).toBe('Good conditions for the bars.');
  });
});

describe('time and place', () => {
  it('shows the time at the location from its UTC offset', () => {
    expect(localTimeAt(now, 19800)).toBe('6:00 pm');
    expect(localTimeAt(now, -5 * 3600)).toBe('7:30 am');
    expect(localTimeAt(new Date('2026-11-06T00:05:00Z'), 0)).toBe('12:05 am');
  });
  it('formats sunrise and sunset', () => {
    expect(to12h('18:04')).toBe('6:04 pm');
    expect(to12h('06:36')).toBe('6:36 am');
    expect(to12h(null)).toBeNull();
  });
  it('names places from either geocoder', () => {
    expect(placeName({ city: 'Mumbai', principalSubdivision: 'Maharashtra' })).toBe('Mumbai, Maharashtra');
    expect(placeName({ city: '', locality: 'Bandra', countryName: 'India' })).toBe('Bandra, India');
    expect(placeName({ city: 'Delhi', region: 'Delhi' })).toBe('Delhi');
    expect(placeName(null)).toBeNull();
  });
  it('refetches after 15 minutes', () => {
    expect(isStale(null, now)).toBe(true);
    expect(isStale(w({ fetchedAt: '2026-11-06T12:20:00Z' }), now)).toBe(false);
    expect(isStale(w({ fetchedAt: '2026-11-06T12:10:00Z' }), now)).toBe(true);
  });
});
