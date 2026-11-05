import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getExercise } from '@/lib/exercises';
import type { Workout } from '@/lib/types';
import { colors, radius, space } from '@/theme';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function WorkoutCard({ workout }: { workout: Workout }) {
  const names = workout.entries.map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId);
  const sets = workout.entries.reduce((n, e) => n + e.sets.length, 0);
  return (
    <Pressable onPress={() => router.push(`/workout/${workout.id}`)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      <View style={styles.row}>
        <Text style={styles.date}>{formatDate(workout.date)}</Text>
        <Text style={styles.sets}>
          {sets} {sets === 1 ? 'set' : 'sets'}
        </Text>
      </View>
      <Text style={styles.names} numberOfLines={2}>
        {names.join(' · ')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, gap: space.xs, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sets: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  names: { color: colors.muted, fontSize: 13 },
});
