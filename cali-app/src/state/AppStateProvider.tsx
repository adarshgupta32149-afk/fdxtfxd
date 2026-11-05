import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState as RNAppState, View } from 'react-native';

import { parseState, newId, touchLastSeen, createInitialState } from '@/lib/state';
import { getAccess, type Access } from '@/lib/trial';
import type { AppState, Profile, Workout } from '@/lib/types';
import { colors } from '@/theme';

const STORAGE_KEY = 'cali.state.v1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface AppStateContextValue {
  state: AppState;
  access: Access;
  /** Saves a workout and returns its id, or null if logging is locked. */
  addWorkout: (workout: Omit<Workout, 'id'>) => string | null;
  deleteWorkout: (id: string) => void;
  /** Ticks or unticks a skill step by hand. Ignored while logging is locked. */
  toggleStep: (stepId: string) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  eraseAllData: () => void;
  dev: {
    setPro: (isPro: boolean) => void;
    /** Pretends the trial started `days` earlier, to test the countdown and lock. */
    ageTrial: (days: number) => void;
    restartTrial: () => void;
  };
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const loaded = useRef(false);

  // Load once on start.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .catch(() => null)
      .then((raw) => {
        loaded.current = true;
        setState(touchLastSeen(parseState(raw, new Date()), new Date()));
      });
  }, []);

  // Save after every change.
  useEffect(() => {
    if (!loaded.current || !state) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // Refresh "last seen" whenever the app comes back to the foreground.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') setState((s) => (s ? touchLastSeen(s, new Date()) : s));
    });
    return () => sub.remove();
  }, []);

  const access = useMemo(() => (state ? getAccess(state, new Date()) : null), [state]);

  const addWorkout = useCallback(
    (workout: Omit<Workout, 'id'>) => {
      if (!state || !access?.canLog) return null;
      const id = newId();
      setState((s) => (s ? { ...s, workouts: [{ ...workout, id }, ...s.workouts] } : s));
      return id;
    },
    [state, access],
  );

  const deleteWorkout = useCallback((id: string) => {
    setState((s) => (s ? { ...s, workouts: s.workouts.filter((w) => w.id !== id) } : s));
  }, []);

  const toggleStep = useCallback(
    (stepId: string) => {
      if (!access?.canLog) return;
      setState((s) => {
        if (!s) return s;
        const manualSteps = { ...s.manualSteps };
        if (manualSteps[stepId]) delete manualSteps[stepId];
        else manualSteps[stepId] = new Date().toISOString();
        return { ...s, manualSteps };
      });
    },
    [access],
  );

  const updateProfile = useCallback((profile: Partial<Profile>) => {
    setState((s) => (s ? { ...s, profile: { ...s.profile, ...profile } } : s));
  }, []);

  const eraseAllData = useCallback(() => {
    // Keeps the original trial dates so erasing data can't be used to restart the trial.
    setState((s) => (s ? { ...createInitialState(new Date()), trialStartedAt: s.trialStartedAt, lastSeenAt: s.lastSeenAt, isPro: s.isPro } : s));
  }, []);

  const dev = useMemo(
    () => ({
      setPro: (isPro: boolean) => setState((s) => (s ? { ...s, isPro } : s)),
      ageTrial: (days: number) =>
        setState((s) => (s ? { ...s, trialStartedAt: new Date(new Date(s.trialStartedAt).getTime() - days * DAY_MS).toISOString() } : s)),
      restartTrial: () =>
        setState((s) => {
          if (!s) return s;
          const now = new Date().toISOString();
          return { ...s, trialStartedAt: now, lastSeenAt: now };
        }),
    }),
    [],
  );

  if (!state || !access) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <AppStateContext.Provider value={{ state, access, addWorkout, deleteWorkout, toggleStep, updateProfile, eraseAllData, dev }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
