import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { TrialBanner } from '@/components/TrialBanner';
import { Body, Button, Card, H1, H2, Muted, ProgressBar, Screen, Stat } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { completedStepIds, countSets, skillProgress, workoutsThisWeek } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState } from '@/state/AppStateProvider';
import { colors } from '@/theme';

export default function TodayScreen() {
  const { state, access } = useAppState();
  const week = useMemo(() => workoutsThisWeek(state.workouts, new Date()), [state.workouts]);
  const completed = useMemo(() => completedStepIds(state), [state]);

  // Skills already started first, then the rest, so "next up" stays relevant.
  const nextUp = useMemo(
    () =>
      SKILLS.map((skill) => ({ skill, progress: skillProgress(skill, completed) }))
        .filter((s) => s.progress.nextStep)
        .sort((a, b) => b.progress.done - a.progress.done)
        .slice(0, 3),
    [completed],
  );

  const name = state.profile.displayName.trim();

  return (
    <Screen>
      <H1>{name ? `Let's go, ${name}` : "Let's train"}</H1>
      <TrialBanner />

      <Button
        label={access.canLog ? 'Start workout' : 'Go Pro to keep logging'}
        variant={access.canLog ? 'primary' : 'gold'}
        onPress={() => router.push(access.canLog ? '/workout/new' : '/paywall')}
      />

      <Card>
        <H2>This week</H2>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat value={week.length} label="workouts" />
          <Stat value={countSets(week)} label="sets" />
          <Stat value={completed.size} label="skill steps" />
        </View>
      </Card>

      <Card>
        <H2>Next up</H2>
        {nextUp.map(({ skill, progress }) => (
          <View key={skill.id} style={{ gap: 6, marginTop: 6 }}>
            <Body>
              <Body style={{ fontWeight: '700' }}>{skill.name}: </Body>
              {progress.nextStep?.name}
            </Body>
            <ProgressBar value={progress.done / progress.total} color={colors.blue} />
            <Muted>
              {progress.done}/{progress.total} steps
            </Muted>
          </View>
        ))}
      </Card>

      <H2>Recent</H2>
      {state.workouts.length === 0 ? (
        <Muted>No workouts yet. Log your first one and your records start building.</Muted>
      ) : (
        state.workouts.slice(0, 3).map((w) => <WorkoutCard key={w.id} workout={w} />)
      )}
    </Screen>
  );
}
