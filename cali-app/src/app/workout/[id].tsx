import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, FrostCard, Muted, Screen } from '@/components/ui';
import { formatDate } from '@/components/WorkoutCard';
import { getExercise } from '@/lib/exercises';
import { completedStepIds, formatSet } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState } from '@/state/AppStateProvider';
import { colors, font } from '@/theme';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteWorkout } = useAppState();
  const [confirm, setConfirm] = useState(false);
  const workout = state.workouts.find((w) => w.id === id);

  // Skill steps this workout unlocked: done with it, not done without it.
  const unlocked = useMemo(() => {
    if (!workout) return [];
    const withIt = completedStepIds(state);
    const without = completedStepIds({ workouts: state.workouts.filter((w) => w.id !== workout.id), manualSteps: state.manualSteps });
    return SKILLS.flatMap((skill) => skill.steps.filter((st) => withIt.has(st.id) && !without.has(st.id)).map((st) => ({ skill, step: st })));
  }, [state, workout]);

  if (!workout) {
    return (
      <Screen>
        <Muted>This workout no longer exists.</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: formatDate(workout.date) }} />

      {unlocked.length > 0 && (
        <FrostCard>
          <Text style={s.unlockKicker}>New skill {unlocked.length === 1 ? 'step' : 'steps'} unlocked</Text>
          <View style={{ gap: 10 }}>
            {unlocked.map(({ skill, step }) => (
              <View key={step.id} style={s.unlockRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.onFrost} />
                <Text style={s.unlockText}>
                  {skill.name} · {step.name}
                </Text>
              </View>
            ))}
          </View>
        </FrostCard>
      )}

      {workout.entries.map((entry, i) => (
        <Card key={i} style={{ gap: 0, paddingVertical: 8 }}>
          <Text style={s.exercise}>{getExercise(entry.exerciseId)?.name ?? entry.exerciseId}</Text>
          {entry.sets.map((set, j) => (
            <View key={j} style={s.setRow}>
              <Muted>Set {j + 1}</Muted>
              <Body style={{ fontWeight: '500' }}>{formatSet(set)}</Body>
            </View>
          ))}
        </Card>
      ))}

      <Button
        label={confirm ? 'Tap again to delete' : 'Delete workout'}
        variant="danger"
        onPress={() => {
          if (!confirm) return setConfirm(true);
          deleteWorkout(workout.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  unlockKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  unlockRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  unlockText: { fontFamily: font, color: colors.onFrost, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  exercise: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '600', paddingVertical: 10 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
});
