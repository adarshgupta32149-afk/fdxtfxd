import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState as RNAppState, View } from 'react-native';

import type { Json } from '@/lib/database.types';
import { createInitialState, newId, parseState, touchLastSeen } from '@/lib/state';
import { supabase } from '@/lib/supabase';
import { clearAccountData, isFirstSync, mergeRemote, planSync, prepareForUser, workoutFromRow, type RemoteSnapshot } from '@/lib/sync';
import { getAccess, type Access } from '@/lib/trial';
import type { AppState, Profile, Workout } from '@/lib/types';
import { colors } from '@/theme';

const STORAGE_KEY = 'cali.state.v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const SYNC_DELAY_MS = 1500;

export interface Account {
  userId: string;
  email?: string;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'error';
  message?: string;
  lastSyncedAt?: string;
}

interface AppStateContextValue {
  state: AppState;
  access: Access;
  /** Whether this build has backend settings (accounts, sync, leaderboards). */
  backendAvailable: boolean;
  account: Account | null;
  sync: SyncState;
  /** Saves a workout and returns its id, or null if logging is locked. */
  addWorkout: (workout: Omit<Workout, 'id'>) => string | null;
  deleteWorkout: (id: string) => void;
  /** Ticks or unticks a skill step by hand. Ignored while logging is locked. */
  toggleStep: (stepId: string) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  eraseAllData: () => void;
  syncNow: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Permanently deletes the account and everything stored with it. Returns an error message on failure. */
  deleteAccount: () => Promise<string | null>;
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
  const [account, setAccount] = useState<Account | null>(null);
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const loaded = useRef(false);

  // Refs let the sync read the latest values without re-creating callbacks.
  // These effects are declared first so the refs are current before any sync effect runs.
  const stateRef = useRef<AppState | null>(null);
  const accountRef = useRef<Account | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);
  const syncing = useRef(false);
  const syncAgain = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSyncRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // ---------- local storage ----------
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .catch(() => null)
      .then((raw) => {
        loaded.current = true;
        setState(touchLastSeen(parseState(raw, new Date()), new Date()));
      });
  }, []);

  useEffect(() => {
    if (!loaded.current || !state) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // ---------- account ----------
  useEffect(() => {
    if (!supabase) return;
    const toAccount = (user: { id: string; email?: string } | null | undefined): Account | null =>
      user ? { userId: user.id, email: user.email } : null;
    supabase.auth.getSession().then(({ data }) => setAccount(toAccount(data.session?.user)));
    // Only update React state here; Supabase warns against awaiting its own calls inside this callback.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAccount(toAccount(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);

  // ---------- sync ----------
  const runSync = useCallback(async (): Promise<void> => {
    const client = supabase;
    const userId = accountRef.current?.userId;
    if (!client || !userId || !stateRef.current) return;
    if (syncing.current) {
      syncAgain.current = true;
      return;
    }
    syncing.current = true;
    setSync((s) => ({ ...s, status: 'syncing', message: undefined }));
    try {
      const local = prepareForUser(stateRef.current, userId);
      const firstSync = isFirstSync(local, userId);

      // Never lets a trial be extended: the server keeps the earlier of the two start dates.
      const claim = await client.rpc('claim_earlier_trial_start', { started_at: local.trialStartedAt });
      if (claim.error) throw claim.error;

      const [profileRes, workoutsRes, stepsRes] = await Promise.all([
        client.from('profiles').select('display_name, bodyweight_kg, trial_started_at, is_pro').eq('id', userId).single(),
        client.from('workouts').select('id, date, entries, note'),
        client.from('skill_steps').select('step_id, done_at'),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (workoutsRes.error) throw workoutsRes.error;
      if (stepsRes.error) throw stepsRes.error;

      const remote: RemoteSnapshot = {
        workouts: workoutsRes.data.map(workoutFromRow).filter((w): w is Workout => w !== null),
        steps: Object.fromEntries(stepsRes.data.map((r) => [r.step_id, new Date(r.done_at).toISOString()])),
        profile: {
          displayName: profileRes.data.display_name,
          bodyweightKg: profileRes.data.bodyweight_kg,
          trialStartedAt: new Date(profileRes.data.trial_started_at).toISOString(),
          isPro: profileRes.data.is_pro,
        },
      };
      const plan = planSync(local, remote, firstSync);

      // Pending deletions that the server never had are done already.
      const clearedWorkoutDeletes = local.pendingWorkoutDeletes.filter((id) => !plan.deleteWorkoutIds.includes(id));
      const clearedStepRemovals = local.pendingStepRemovals.filter((id) => !plan.deleteStepIds.includes(id));
      const problems: string[] = [];

      if (plan.deleteWorkoutIds.length) {
        const r = await client.from('workouts').delete().in('id', plan.deleteWorkoutIds);
        if (r.error) problems.push(r.error.message);
        else clearedWorkoutDeletes.push(...plan.deleteWorkoutIds);
      }
      if (plan.deleteStepIds.length) {
        const r = await client.from('skill_steps').delete().in('step_id', plan.deleteStepIds);
        if (r.error) problems.push(r.error.message);
        else clearedStepRemovals.push(...plan.deleteStepIds);
      }

      let uploadBlocked = false;
      if (plan.uploadWorkouts.length) {
        const rows = plan.uploadWorkouts.map((w) => ({ id: w.id, date: w.date, entries: w.entries as unknown as Json, note: w.note ?? null }));
        const r = await client.from('workouts').insert(rows);
        if (r.error) uploadBlocked = true;
      }
      if (plan.uploadSteps.length) {
        const r = await client.from('skill_steps').insert(plan.uploadSteps.map((s) => ({ step_id: s.stepId, done_at: s.doneAt })));
        if (r.error) uploadBlocked = true;
      }

      let serverProfile = { displayName: remote.profile.displayName, bodyweightKg: remote.profile.bodyweightKg };
      if (plan.profileUpdate) {
        const r = await client.from('profiles').update(plan.profileUpdate).eq('id', userId);
        if (r.error) problems.push(r.error.message);
        else serverProfile = { displayName: plan.profileUpdate.display_name, bodyweightKg: plan.profileUpdate.bodyweight_kg };
      }

      setState((current) =>
        current ? mergeRemote(current, remote, { userId, firstSync, clearedWorkoutDeletes, clearedStepRemovals, serverProfile }) : current,
      );

      if (uploadBlocked) {
        const expired = !getAccess({ ...remote.profile, lastSeenAt: local.lastSeenAt }, new Date()).canLog;
        setSync({
          status: 'error',
          message: expired
            ? 'Your trial has ended, so new workouts stay on this phone until you go Pro.'
            : 'Some workouts could not be backed up yet. We will retry automatically.',
        });
      } else if (problems.length) {
        setSync({ status: 'error', message: 'Some changes could not be synced. We will retry automatically.' });
      } else {
        setSync({ status: 'idle', lastSyncedAt: new Date().toISOString() });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
      setSync((s) => ({
        ...s,
        status: 'error',
        message: /fetch|network/i.test(message) ? "You're offline. Changes will sync when you're back online." : `Sync failed: ${message}`,
      }));
    } finally {
      syncing.current = false;
      if (syncAgain.current) {
        syncAgain.current = false;
        void runSyncRef.current();
      }
    }
  }, []);
  useEffect(() => {
    runSyncRef.current = runSync;
  }, [runSync]);

  const scheduleSync = useCallback(() => {
    if (!accountRef.current) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void runSync(), SYNC_DELAY_MS);
  }, [runSync]);

  // Sync as soon as someone signs in (and once the local data has loaded).
  const userId = account?.userId;
  const hasState = state !== null;
  useEffect(() => {
    if (userId && hasState) void runSync();
  }, [userId, hasState, runSync]);

  // Refresh "last seen" and sync whenever the app comes back to the foreground.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      setState((s) => (s ? touchLastSeen(s, new Date()) : s));
      void runSync();
    });
    return () => sub.remove();
  }, [runSync]);

  // ---------- actions ----------
  const access = useMemo(() => (state ? getAccess(state, new Date()) : null), [state]);

  const addWorkout = useCallback(
    (workout: Omit<Workout, 'id'>) => {
      if (!state || !access?.canLog) return null;
      const id = newId();
      setState((s) => (s ? { ...s, workouts: [{ ...workout, id }, ...s.workouts] } : s));
      scheduleSync();
      return id;
    },
    [state, access, scheduleSync],
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      setState((s) => {
        if (!s) return s;
        const pending = s.ownerId && !s.pendingWorkoutDeletes.includes(id) ? [...s.pendingWorkoutDeletes, id] : s.pendingWorkoutDeletes;
        return { ...s, workouts: s.workouts.filter((w) => w.id !== id), pendingWorkoutDeletes: pending };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  const toggleStep = useCallback(
    (stepId: string) => {
      if (!access?.canLog) return;
      setState((s) => {
        if (!s) return s;
        const manualSteps = { ...s.manualSteps };
        let pendingStepRemovals = s.pendingStepRemovals.filter((id) => id !== stepId);
        if (manualSteps[stepId]) {
          delete manualSteps[stepId];
          if (s.ownerId) pendingStepRemovals = [...pendingStepRemovals, stepId];
        } else {
          manualSteps[stepId] = new Date().toISOString();
        }
        return { ...s, manualSteps, pendingStepRemovals };
      });
      scheduleSync();
    },
    [access, scheduleSync],
  );

  const updateProfile = useCallback(
    (profile: Partial<Profile>) => {
      setState((s) => (s ? { ...s, profile: { ...s.profile, ...profile } } : s));
      scheduleSync();
    },
    [scheduleSync],
  );

  const eraseAllData = useCallback(() => {
    // Keeps the original trial dates so erasing data can't be used to restart the trial.
    setState((s) =>
      s ? { ...createInitialState(new Date()), trialStartedAt: s.trialStartedAt, lastSeenAt: s.lastSeenAt, isPro: s.isPro } : s,
    );
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await runSync(); // last chance to back up anything still on the phone
    await supabase.auth.signOut().catch(() => {});
    setAccount(null);
    setSync({ status: 'idle' });
    setState((s) => (s ? clearAccountData(s) : s));
  }, [runSync]);

  const deleteAccount = useCallback(async (): Promise<string | null> => {
    if (!supabase) return 'Accounts are not available in this build.';
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return /fetch|network/i.test(error.message) ? "You're offline. Connect to the internet and try again." : error.message;
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    setAccount(null);
    setSync({ status: 'idle' });
    setState((s) => (s ? clearAccountData(s) : s));
    return null;
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
    <AppStateContext.Provider
      value={{
        state,
        access,
        backendAvailable: supabase !== null,
        account,
        sync,
        addWorkout,
        deleteWorkout,
        toggleStep,
        updateProfile,
        eraseAllData,
        syncNow: runSync,
        signOut,
        deleteAccount,
        dev,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
