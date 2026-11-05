import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Card, H2, Muted, Screen } from '@/components/ui';
import { formatDate } from '@/components/WorkoutCard';
import { getExercise } from '@/lib/exercises';
import { completedStepIds, formatSet } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState } from '@/state/AppStateProvider';
import { colors } from '@/theme';

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
        <Card style={{ borderColor: colors.accent }}>
          <H2 style={{ color: colors.accent }}>Unlocked 🔓</H2>
          {unlocked.map(({ skill, step }) => (
            <View key={step.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              <Body>
                {skill.name}: {step.name}
              </Body>
            </View>
          ))}
        </Card>
      )}

      {workout.entries.map((entry, i) => (
        <Card key={i}>
          <H2>{getExercise(entry.exerciseId)?.name ?? entry.exerciseId}</H2>
          {entry.sets.map((set, j) => (
            <Body key={j}>
              <Muted>Set {j + 1} </Muted>
              {formatSet(set)}
            </Body>
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
