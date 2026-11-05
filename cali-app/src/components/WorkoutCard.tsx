import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressScale } from '@/components/motion';
import { getExercise } from '@/lib/exercises';
import type { Workout } from '@/lib/types';
import { colors, display, font, radius } from '@/theme';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** A logged session: a date tile, what was trained, and how many sets. */
export function WorkoutCard({ workout }: { workout: Workout }) {
  const date = new Date(workout.date);
  const names = workout.entries.map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId);
  const sets = workout.entries.reduce((n, e) => n + e.sets.length, 0);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return (
    <PressScale onPress={() => router.push(`/workout/${workout.id}`)} scaleTo={0.98} style={s.card} accessibilityLabel={`Session on ${formatDate(workout.date)}`}>
      <View style={s.dateTile}>
        <Text style={s.day}>{date.getDate()}</Text>
        <Text style={s.weekday}>{date.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={s.names} numberOfLines={1}>
          {names.join(' · ')}
        </Text>
        <Text style={s.meta}>
          {time} · {sets} {sets === 1 ? 'set' : 'sets'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.faint} />
    </PressScale>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTile: { width: 48, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  day: { fontFamily: display, color: colors.text, fontSize: 24, lineHeight: 26, fontWeight: '700' },
  weekday: { fontFamily: font, color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  names: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
});
