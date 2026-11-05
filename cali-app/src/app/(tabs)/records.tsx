import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card, H2, Muted, Screen } from '@/components/ui';
import { CATEGORY_LABELS, EXERCISES } from '@/lib/exercises';
import { computeRecords, type ExerciseRecord } from '@/lib/records';
import { supabase } from '@/lib/supabase';
import type { ExerciseCategory } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, space } from '@/theme';

type BoardId = 'max_pull_ups' | 'max_muscle_ups' | 'weighted_pull_up_kg' | 'handstand_hold_sec';
interface BoardRow {
  rank: number;
  display_name: string;
  value: number;
}

/** The leaderboard categories, matching the `board` values allowed in the database. */
const BOARDS: { id: BoardId; label: string; exerciseId: string; unit: (v: number) => string; mine: (r?: ExerciseRecord) => number | undefined }[] = [
  { id: 'max_pull_ups', label: 'Max pull-ups', exerciseId: 'pull-up', unit: (v) => `${v} reps`, mine: (r) => r?.maxReps },
  { id: 'max_muscle_ups', label: 'Max muscle-ups', exerciseId: 'muscle-up', unit: (v) => `${v} reps`, mine: (r) => r?.maxReps },
  { id: 'weighted_pull_up_kg', label: 'Heaviest pull-up', exerciseId: 'pull-up', unit: (v) => `+${v}kg`, mine: (r) => r?.maxKg },
  { id: 'handstand_hold_sec', label: 'Longest handstand', exerciseId: 'handstand', unit: (v) => `${v}s`, mine: (r) => r?.maxHoldSec },
];

/** Loads the top of every board whenever the Records tab is opened. */
function useLeaderboards() {
  const [boards, setBoards] = useState<Partial<Record<BoardId, BoardRow[]>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const client = supabase;
      if (!client) return;
      let cancelled = false;
      setLoading(true);
      Promise.all(BOARDS.map((b) => client.rpc('get_leaderboard', { board_name: b.id, max_rows: 3 })))
        .then((results) => {
          if (cancelled) return;
          const failed = results.find((r) => r.error);
          if (failed?.error) {
            setError(/fetch|network/i.test(failed.error.message) ? "Can't load rankings while offline." : "Couldn't load rankings right now.");
            return;
          }
          setError(null);
          setBoards(Object.fromEntries(results.map((r, i) => [BOARDS[i].id, r.data ?? []])));
        })
        .catch(() => !cancelled && setError("Can't load rankings while offline."))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { boards, loading, error };
}

function describe(record: ExerciseRecord): string {
  const parts: string[] = [];
  if (record.maxReps) parts.push(`${record.maxReps} reps`);
  if (record.maxHoldSec) parts.push(`${record.maxHoldSec}s hold`);
  if (record.maxKg) parts.push(`${record.maxKg}kg top load`);
  if (record.est1RM) parts.push(`~${record.est1RM}kg est. 1RM`);
  return parts.join(' · ');
}

export default function RecordsScreen() {
  const { state, backendAvailable } = useAppState();
  const records = useMemo(() => computeRecords(state.workouts), [state.workouts]);
  const { boards, loading, error } = useLeaderboards();

  const grouped = useMemo(() => {
    const out: Partial<Record<ExerciseCategory, ExerciseRecord[]>> = {};
    for (const ex of EXERCISES) {
      const rec = records[ex.id];
      if (rec) (out[ex.category] ??= []).push(rec);
    }
    return out;
  }, [records]);

  return (
    <Screen>
      <Card style={{ borderColor: colors.gold }}>
        <View style={s.boardHeader}>
          <H2 style={{ color: colors.gold, flex: 1 }}>World leaderboards</H2>
          {loading && <ActivityIndicator size="small" color={colors.gold} />}
        </View>
        <Muted>Only video-verified scores are ranked. Submitting your own with video proof is coming next.</Muted>
        {error && <Muted style={{ color: colors.danger }}>{error}</Muted>}
        {BOARDS.map((b) => {
          const mine = b.mine(records[b.exerciseId]);
          const top = boards[b.id];
          return (
            <View key={b.id} style={s.board}>
              <View style={s.rowNoBorder}>
                <Text style={[s.label, { fontWeight: '700' }]}>{b.label}</Text>
                <Text style={s.value}>You: {mine ? b.unit(mine) : '—'}</Text>
              </View>
              {backendAvailable && top && top.length === 0 && <Muted>No verified scores yet. The first spot is open.</Muted>}
              {top?.map((row) => (
                <View key={`${b.id}-${row.rank}-${row.display_name}`} style={s.rowNoBorder}>
                  <Text style={s.rank}>#{row.rank}</Text>
                  <Text style={[s.label, { flex: 1 }]} numberOfLines={1}>
                    {row.display_name}
                  </Text>
                  <Text style={s.value}>{b.unit(row.value)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </Card>

      {Object.keys(grouped).length === 0 ? (
        <Muted>Log a workout and your personal records will appear here.</Muted>
      ) : (
        (Object.keys(CATEGORY_LABELS) as ExerciseCategory[])
          .filter((c) => grouped[c])
          .map((c) => (
            <Card key={c}>
              <H2>{CATEGORY_LABELS[c]}</H2>
              {grouped[c]!.map((rec) => (
                <View key={rec.exerciseId} style={s.row}>
                  <Text style={s.label}>{EXERCISES.find((e) => e.id === rec.exerciseId)?.name}</Text>
                  <Text style={s.value}>{describe(rec)}</Text>
                </View>
              ))}
            </Card>
          ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  boardHeader: { flexDirection: 'row', alignItems: 'center' },
  board: { gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  rowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  rank: { color: colors.gold, fontWeight: '800', width: 32 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.text, fontSize: 14, flexShrink: 1 },
  value: { color: colors.accent, fontSize: 14, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
});
