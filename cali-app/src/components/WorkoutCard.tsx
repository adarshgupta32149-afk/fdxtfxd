import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getExercise } from '@/lib/exercises';
import type { Workout } from '@/lib/types';
import { colors, font, radius, space } from '@/theme';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function WorkoutCard({ workout }: { workout: Workout }) {
  const names = workout.entries.map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId);
  const sets = workout.entries.reduce((n, e) => n + e.sets.length, 0);
  return (
    <Pressable onPress={() => router.push(`/workout/${workout.id}`)} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.date}>{formatDate(workout.date)}</Text>
        <Text style={s.names} numberOfLines={1}>
          {names.join(' · ')}
        </Text>
      </View>
      <Text style={s.sets}>
        {sets} {sets === 1 ? 'set' : 'sets'}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.faint} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  date: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600' },
  names: { fontFamily: font, color: colors.muted, fontSize: 13 },
  sets: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '500' },
});
