import { StyleSheet, Text, View } from 'react-native';

import type { Workout } from '@/lib/types';
import { colors, font } from '@/theme';

/** Monday-to-Sunday dots for the current week: filled on days you trained, ringed for today. */
export function WeekStrip({ workouts, now, tone = 'glass' }: { workouts: Workout[]; now: Date; tone?: 'glass' | 'moss' }) {
  const moss = tone === 'moss';
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const trained = new Set(workouts.map((w) => new Date(w.date).toDateString()));

  return (
    <View style={s.row} accessibilityLabel="Days trained this week">
      {Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const did = trained.has(day.toDateString());
        const isToday = day.toDateString() === now.toDateString();
        const future = day > now && !isToday;
        return (
          <View key={i} style={s.col}>
            <Text style={[s.letter, moss && { color: 'rgba(143,211,174,0.6)' }, isToday && { color: colors.text }]}>
              {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
            <View style={[s.dot, moss && s.dotMoss, did && (moss ? s.doneMoss : s.done), isToday && !did && s.today, future && { opacity: 0.4 }]} />
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 6, flex: 1 },
  letter: { fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '700' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(228,228,230,0.07)', borderWidth: 1, borderColor: colors.border },
  done: { backgroundColor: colors.frost, borderColor: colors.frost },
  dotMoss: { backgroundColor: 'rgba(143,211,174,0.08)', borderColor: 'rgba(143,211,174,0.22)' },
  doneMoss: { backgroundColor: colors.sage, borderColor: colors.sage },
  today: { borderColor: colors.ember, borderWidth: 2 },
});
