import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { isStale, parseWeather, placeName, placeUrl, weatherUrl, type Weather } from '@/lib/weather';

const CACHE_KEY = 'cali.weather.v1';
/** A cached reading this old is still shown while a fresh one loads. */
const SHOW_CACHED_MS = 3 * 60 * 60_000;

export type WeatherStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

export interface LocalWeather {
  status: WeatherStatus;
  place: string | null;
  weather: Weather | null;
  /** Why the weather is missing, when the location worked but the forecast did not. */
  weatherError: string | null;
  /** Asks for location permission (if needed) and loads everything. */
  enable: () => void;
  refresh: () => void;
}

async function lookUpPlace(lat: number, lon: number): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      const r = await fetch(placeUrl(lat, lon));
      return placeName(await r.json());
    }
    const [first] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    return placeName(first);
  } catch {
    return null;
  }
}

async function lookUpWeather(lat: number, lon: number): Promise<{ weather: Weather | null; error: string | null }> {
  try {
    const r = await fetch(weatherUrl(lat, lon));
    const parsed = parseWeather(await r.json(), new Date());
    return parsed.ok ? { weather: parsed.weather, error: null } : { weather: null, error: parsed.reason };
  } catch {
    return { weather: null, error: 'Could not reach the weather service.' };
  }
}

/** Live location → place name, local weather and the location's time zone. */
export function useLocalWeather(): LocalWeather {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [place, setPlace] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setStatus((s) => (s === 'ready' ? s : 'locating'));
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const [name, w] = await Promise.all([lookUpPlace(latitude, longitude), lookUpWeather(latitude, longitude)]);
      setPlace(name);
      setWeather((prev) => w.weather ?? prev);
      setWeatherError(w.weather ? null : w.error);
      setStatus('ready');
      if (w.weather) AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ place: name, weather: w.weather })).catch(() => {});
    } catch {
      setStatus((s) => (s === 'ready' ? s : 'unavailable'));
    } finally {
      busy.current = false;
    }
  }, []);

  const enable = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return setStatus('denied');
      await load();
    } catch {
      setStatus('unavailable');
    }
  }, [load]);

  // On start: show the last reading straight away, then refresh if permission is already given.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const cached = JSON.parse(raw) as { place: string | null; weather: Weather };
        if (Date.now() - new Date(cached.weather.fetchedAt).getTime() < SHOW_CACHED_MS) {
          setPlace(cached.place);
          setWeather(cached.weather);
          setStatus('ready');
        }
      })
      .catch(() => {});
    Location.getForegroundPermissionsAsync()
      .then((perm) => {
        if (cancelled) return;
        if (perm.granted) load();
        else if (!perm.canAskAgain) setStatus('denied');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Keep it fresh while the app is open.
  useEffect(() => {
    if (status !== 'ready') return;
    const t = setInterval(() => {
      if (isStale(weather, new Date())) load();
    }, 60_000);
    return () => clearInterval(t);
  }, [status, weather, load]);

  return { status, place, weather, weatherError, enable: () => void enable(), refresh: () => void load() };
}
