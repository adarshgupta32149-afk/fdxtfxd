import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card, Eyebrow, H1, Muted, Screen } from '@/components/ui';
import { CATEGORY_LABELS, EXERCISES } from '@/lib/exercises';
import { computeRecords, type ExerciseRecord } from '@/lib/records';
import { supabase } from '@/lib/supabase';
import type { ExerciseCategory } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, font, space } from '@/theme';

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
    <Screen topInset>
      <View style={{ gap: 4 }}>
        <H1>Records</H1>
        <Muted>{"Your bests, and where they'd rank in the world."}</Muted>
      </View>

      <View style={s.sectionHead}>
        <Eyebrow>World leaderboards</Eyebrow>
        {loading && <ActivityIndicator size="small" color={colors.muted} />}
      </View>
      {error && <Muted style={{ color: colors.danger }}>{error}</Muted>}
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {BOARDS.map((b, i) => {
          const mine = b.mine(records[b.exerciseId]);
          const top = boards[b.id];
          return (
            <View key={b.id} style={[s.board, i > 0 && s.divider]}>
              <View style={s.line}>
                <Text style={s.boardName}>{b.label}</Text>
                <Text style={s.mine}>You {mine ? b.unit(mine) : '—'}</Text>
              </View>
              {backendAvailable && top && top.length === 0 && <Text style={s.empty}>No verified scores yet. The first spot is open.</Text>}
              {top?.map((row) => (
                <View key={`${b.id}-${row.rank}-${row.display_name}`} style={s.line}>
                  <Text style={s.rank}>{row.rank}</Text>
                  <Text style={[s.person, { flex: 1 }]} numberOfLines={1}>
                    {row.display_name}
                  </Text>
                  <Text style={s.score}>{b.unit(row.value)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </Card>
      <Muted style={{ fontSize: 12 }}>Only video-verified scores are ranked. Submitting yours with video is coming next.</Muted>

      <Eyebrow style={{ marginTop: space.sm }}>Personal records</Eyebrow>
      {Object.keys(grouped).length === 0 ? (
        <Muted>Log a workout and your records will appear here.</Muted>
      ) : (
        (Object.keys(CATEGORY_LABELS) as ExerciseCategory[])
          .filter((c) => grouped[c])
          .map((c) => (
            <Card key={c} style={{ gap: 0, paddingVertical: 6 }}>
              <Text style={s.category}>{CATEGORY_LABELS[c]}</Text>
              {grouped[c]!.map((rec) => (
                <View key={rec.exerciseId} style={[s.line, s.divider, { paddingVertical: 12 }]}>
                  <Text style={[s.person, { flexShrink: 1 }]}>{EXERCISES.find((e) => e.id === rec.exerciseId)?.name}</Text>
                  <Text style={s.score}>{describe(rec)}</Text>
                </View>
              ))}
            </Card>
          ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  board: { gap: 8, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  boardName: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600' },
  mine: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '500' },
  empty: { fontFamily: font, color: colors.faint, fontSize: 13 },
  rank: { fontFamily: font, color: colors.gold, fontWeight: '600', width: 20 },
  person: { fontFamily: font, color: colors.text, fontSize: 14 },
  score: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  category: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', paddingVertical: 12 },
});
