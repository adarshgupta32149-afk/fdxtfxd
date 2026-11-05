import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Rise } from '@/components/motion';
import { Card, Eyebrow, H1, Muted, Screen, SectionHead } from '@/components/ui';
import { BOARDS } from '@/lib/boards';
import { CATEGORY_LABELS, EXERCISES } from '@/lib/exercises';
import { computeRecords, type ExerciseRecord } from '@/lib/records';
import type { ExerciseCategory } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, radius } from '@/theme';

function describe(record: ExerciseRecord): string {
  const parts: string[] = [];
  if (record.maxReps) parts.push(`${record.maxReps} reps`);
  if (record.maxHoldSec) parts.push(`${record.maxHoldSec}s`);
  if (record.maxKg) parts.push(`${record.maxKg}kg`);
  if (record.est1RM) parts.push(`~${record.est1RM}kg 1RM`);
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
    <Screen headerInset contentStyle={{ gap: 18 }}>
      <Rise>
        <Eyebrow>Personal bests</Eyebrow>
        <H1 style={{ marginTop: 6 }}>Records</H1>
      </Rise>

      <Rise delay={70}>
        <View style={s.grid}>
          {BOARDS.map((b) => {
            const mine = b.mine(records[b.exerciseId]);
            return (
              <View key={b.id} style={s.tile}>
                <Text style={s.tileLabel}>{b.label}</Text>
                <Text style={[s.tileValue, !mine && { color: colors.faint }]}>{mine ? b.unit(mine) : '—'}</Text>
              </View>
            );
          })}
        </View>
      </Rise>

      <Rise delay={120}>
        <Text style={s.link} onPress={() => router.push('/ranking')}>
          See how these compare in Ranking →
        </Text>
      </Rise>

      {Object.keys(grouped).length === 0 ? (
        <Rise delay={170}>
          <Card style={s.empty}>
            <Ionicons name="trophy-outline" size={22} color={colors.muted} />
            <Muted style={{ flex: 1 }}>Log a session and your records start filling in here, exercise by exercise.</Muted>
          </Card>
        </Rise>
      ) : (
        (Object.keys(CATEGORY_LABELS) as ExerciseCategory[])
          .filter((c) => grouped[c])
          .map((c, i) => (
            <Rise key={c} delay={170 + i * 50} style={{ gap: 10 }}>
              <SectionHead label={CATEGORY_LABELS[c]} />
              <Card style={{ gap: 0, paddingVertical: 4 }}>
                {grouped[c]!.map((rec, j) => (
                  <View key={rec.exerciseId} style={[s.row, j > 0 && s.rowLine]}>
                    <Text style={s.name}>{EXERCISES.find((e) => e.id === rec.exerciseId)?.name}</Text>
                    <Text style={s.value}>{describe(rec)}</Text>
                  </View>
                ))}
              </Card>
            </Rise>
          ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, padding: 16, gap: 6, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tileLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '700' },
  tileValue: { fontFamily: display, color: colors.text, fontSize: 34, lineHeight: 36, fontWeight: '600' },
  link: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '700' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  value: { fontFamily: display, color: colors.text, fontSize: 19, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
});
