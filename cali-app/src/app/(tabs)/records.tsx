import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, H2, Muted, Screen } from '@/components/ui';
import { CATEGORY_LABELS, EXERCISES } from '@/lib/exercises';
import { computeRecords, type ExerciseRecord } from '@/lib/records';
import type { ExerciseCategory } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, space } from '@/theme';

/** The categories the global leaderboard will rank at launch. */
const BOARDS = [
  { label: 'Max pull-ups', exerciseId: 'pull-up', read: (r?: ExerciseRecord) => (r?.maxReps ? `${r.maxReps} reps` : '—') },
  { label: 'Max muscle-ups', exerciseId: 'muscle-up', read: (r?: ExerciseRecord) => (r?.maxReps ? `${r.maxReps} reps` : '—') },
  { label: 'Heaviest pull-up', exerciseId: 'pull-up', read: (r?: ExerciseRecord) => (r?.maxKg ? `+${r.maxKg}kg` : '—') },
  { label: 'Longest handstand', exerciseId: 'handstand', read: (r?: ExerciseRecord) => (r?.maxHoldSec ? `${r.maxHoldSec}s` : '—') },
];

function describe(record: ExerciseRecord): string {
  const parts: string[] = [];
  if (record.maxReps) parts.push(`${record.maxReps} reps`);
  if (record.maxHoldSec) parts.push(`${record.maxHoldSec}s hold`);
  if (record.maxKg) parts.push(`${record.maxKg}kg top load`);
  if (record.est1RM) parts.push(`~${record.est1RM}kg est. 1RM`);
  return parts.join(' · ');
}

export default function RecordsScreen() {
  const { state } = useAppState();
  const records = useMemo(() => computeRecords(state.workouts), [state.workouts]);

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
        <H2 style={{ color: colors.gold }}>Leaderboards</H2>
        <Muted>{"Video-verified city and world rankings are coming at launch. Here's where you stand right now:"}</Muted>
        {BOARDS.map((b) => (
          <View key={b.label} style={s.row}>
            <Text style={s.label}>{b.label}</Text>
            <Text style={s.value}>{b.read(records[b.exerciseId])}</Text>
          </View>
        ))}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.text, fontSize: 14, flexShrink: 1 },
  value: { color: colors.accent, fontSize: 14, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
});
