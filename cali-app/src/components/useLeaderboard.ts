import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { BoardId, BoardRow } from '@/lib/boards';
import { supabase } from '@/lib/supabase';

export interface LeaderboardState {
  rows: BoardRow[];
  /** True until the first answer (or failure) arrives. */
  loading: boolean;
  /** A message to show instead of rows, e.g. when offline. */
  error: string | null;
  /** False when this build has no backend settings at all. */
  available: boolean;
}

/** Loads the verified top scores for a board each time the screen comes into focus. */
export function useLeaderboard(board: BoardId, limit = 20): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({ rows: [], loading: true, error: null, available: supabase !== null });

  useFocusEffect(
    useCallback(() => {
      const client = supabase;
      if (!client) {
        setState({ rows: [], loading: false, error: null, available: false });
        return;
      }
      let cancelled = false;
      setState((s) => ({ ...s, loading: true }));
      client
        .rpc('get_leaderboard', { board_name: board, max_rows: limit })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            const offline = /fetch|network/i.test(error.message);
            setState({ rows: [], loading: false, error: offline ? "You're offline. Rankings load when you're back online." : "Couldn't load rankings right now.", available: true });
          } else {
            setState({ rows: (data ?? []).map((r) => ({ rank: Number(r.rank), display_name: r.display_name, value: Number(r.value) })), loading: false, error: null, available: true });
          }
        }, () => {
          if (!cancelled) setState({ rows: [], loading: false, error: "You're offline. Rankings load when you're back online.", available: true });
        });
      return () => {
        cancelled = true;
      };
    }, [board, limit]),
  );

  return state;
}
