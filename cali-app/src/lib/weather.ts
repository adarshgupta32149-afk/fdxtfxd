/**
 * Local weather for the session card on Home. Weather comes from Open-Meteo (free, no key);
 * on the web, the place name comes from BigDataCloud's client-side reverse geocoder.
 * Everything here is pure so it can be tested without the network.
 */

export interface Weather {
  tempC: number;
  feelsC: number;
  humidity: number;
  windKmh: number;
  code: number;
  isDay: boolean;
  /** IANA zone of the location, e.g. "Asia/Kolkata". */
  timezone: string;
  utcOffsetSec: number;
  /** Local wall-clock times as "HH:MM", or null when the API leaves them out. */
  sunrise: string | null;
  sunset: string | null;
  uvMax: number | null;
  fetchedAt: string;
}

export function weatherUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    daily: 'sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${q.toString()}`;
}

export function placeUrl(lat: number, lon: number): string {
  return `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&localityLanguage=en`;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const hhmm = (iso: unknown): string | null => (typeof iso === 'string' && /T\d{2}:\d{2}/.test(iso) ? iso.split('T')[1].slice(0, 5) : null);

/** Turns an Open-Meteo response into a Weather, or explains why it cannot. */
export function parseWeather(json: unknown, now: Date): { ok: true; weather: Weather } | { ok: false; reason: string } {
  if (!json || typeof json !== 'object') return { ok: false, reason: 'No weather data came back.' };
  const j = json as Record<string, any>;
  if (j.error) return { ok: false, reason: typeof j.reason === 'string' ? j.reason : 'The weather service returned an error.' };
  const c = j.current ?? {};
  const temp = num(c.temperature_2m);
  const code = num(c.weather_code);
  if (temp == null || code == null) return { ok: false, reason: 'The weather data was incomplete.' };
  return {
    ok: true,
    weather: {
      tempC: temp,
      feelsC: num(c.apparent_temperature) ?? temp,
      humidity: num(c.relative_humidity_2m) ?? 0,
      windKmh: num(c.wind_speed_10m) ?? 0,
      code,
      isDay: c.is_day === 1 || c.is_day === true,
      timezone: typeof j.timezone === 'string' ? j.timezone : 'UTC',
      utcOffsetSec: num(j.utc_offset_seconds) ?? 0,
      sunrise: hhmm(j.daily?.sunrise?.[0]),
      sunset: hhmm(j.daily?.sunset?.[0]),
      uvMax: num(j.daily?.uv_index_max?.[0]),
      fetchedAt: now.toISOString(),
    },
  };
}

/** Picks the most useful place name from BigDataCloud (web) or expo-location (phone) results. */
export function placeName(p: { city?: string | null; locality?: string | null; district?: string | null; subregion?: string | null; principalSubdivision?: string | null; region?: string | null; countryName?: string | null; country?: string | null } | null | undefined): string | null {
  if (!p) return null;
  const local = p.city || p.locality || p.district || p.subregion;
  const wider = p.principalSubdivision || p.region || p.countryName || p.country;
  if (local && wider && local !== wider) return `${local}, ${wider}`;
  return local || wider || null;
}

type IconName = 'sunny' | 'moon' | 'partly-sunny' | 'cloudy-night' | 'cloud' | 'cloudy' | 'rainy' | 'thunderstorm' | 'snow' | 'water';

/** WMO weather code → words and an Ionicons name. */
export type WeatherKey = 'clear' | 'clearNight' | 'partlyCloudy' | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'showers' | 'snow' | 'thunderstorm' | 'cloudy';

/** English labels; the app shows translated ones via the weather.<key> strings. */
export const WEATHER_LABELS: Record<WeatherKey, string> = {
  clear: 'Clear',
  clearNight: 'Clear night',
  partlyCloudy: 'Partly cloudy',
  overcast: 'Overcast',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  showers: 'Showers',
  snow: 'Snow',
  thunderstorm: 'Thunderstorm',
  cloudy: 'Cloudy',
};

export function describeWeather(code: number, isDay: boolean): { key: WeatherKey; label: string; icon: IconName } {
  const d = describeKey(code, isDay);
  return { ...d, label: WEATHER_LABELS[d.key] };
}

function describeKey(code: number, isDay: boolean): { key: WeatherKey; icon: IconName } {
  if (code === 0) return { key: isDay ? 'clear' : 'clearNight', icon: isDay ? 'sunny' : 'moon' };
  if (code <= 2) return { key: 'partlyCloudy', icon: isDay ? 'partly-sunny' : 'cloudy-night' };
  if (code === 3) return { key: 'overcast', icon: 'cloudy' };
  if (code === 45 || code === 48) return { key: 'fog', icon: 'cloud' };
  if (code >= 51 && code <= 57) return { key: 'drizzle', icon: 'water' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { key: code >= 80 ? 'showers' : 'rain', icon: 'rainy' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { key: 'snow', icon: 'snow' };
  if (code >= 95) return { key: 'thunderstorm', icon: 'thunderstorm' };
  return { key: 'cloudy', icon: 'cloud' };
}

const WET = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

export type TipKey = 'storm' | 'wet' | 'veryHot' | 'hot' | 'cold' | 'uv' | 'windy' | 'good';

export const TIP_TEXT: Record<TipKey, string> = {
  storm: 'Thunderstorm. Stay off metal bars today; train indoors.',
  wet: 'Wet bars are slippery. Chalk up, dry the bar, or go indoors.',
  veryHot: 'Very hot. Train early or late, in shade, and drink more than you think.',
  hot: 'Hot out. Shorter sets, longer rests, keep water close.',
  cold: 'Cold. Warm up wrists and shoulders twice as long before holds.',
  uv: 'UV is high. Find shade for long holds and handstands.',
  windy: 'Windy. Handstands outside will be harder today.',
  good: 'Good conditions for the bars.',
};

/** Which tip matters most right now (the app shows the translated weather.tip.<key>). */
export function tipKey(w: Weather): TipKey {
  if (w.code >= 95) return 'storm';
  if (WET(w.code)) return 'wet';
  if (w.feelsC >= 35) return 'veryHot';
  if (w.feelsC >= 30) return 'hot';
  if (w.feelsC <= 5) return 'cold';
  if (w.isDay && (w.uvMax ?? 0) >= 8) return 'uv';
  if (w.windKmh >= 30) return 'windy';
  return 'good';
}

/** One line of advice for training outside right now, in English. */
export const trainingTip = (w: Weather): string => TIP_TEXT[tipKey(w)];

/** The time at the weather's location, as "10:41 pm", from the API's UTC offset. */
export function localTimeAt(now: Date, utcOffsetSec: number): string {
  const t = new Date(now.getTime() + utcOffsetSec * 1000);
  const h24 = t.getUTCHours();
  const h = h24 % 12 || 12;
  return `${h}:${String(t.getUTCMinutes()).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}

/** "HH:MM" (24 h) → "6:12 pm". */
export function to12h(hm: string | null): string | null {
  if (!hm) return null;
  const [H, M] = hm.split(':').map(Number);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return null;
  return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${H < 12 ? 'am' : 'pm'}`;
}

/** Weather older than this is refetched. */
export const WEATHER_MAX_AGE_MS = 15 * 60_000;
export const isStale = (w: Weather | null, now: Date) => !w || now.getTime() - new Date(w.fetchedAt).getTime() > WEATHER_MAX_AGE_MS;
