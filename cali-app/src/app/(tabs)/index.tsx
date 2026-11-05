import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TrialPill } from '@/components/TrialBanner';
import { Button, Card, Eyebrow, FrostCard, H1, Muted, ProgressBar, Screen, Stat } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { completedStepIds, countSets, skillProgress, workoutsThisWeek } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState } from '@/state/AppStateProvider';
import { colors, font, space } from '@/theme';

function todayLabel(now: Date): string {
  const day = now.toLocaleDateString(undefined, { weekday: 'long' });
  const date = now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${day} · ${date}`;
}

export default function TodayScreen() {
  const { state, access } = useAppState();
  const week = useMemo(() => workoutsThisWeek(state.workouts, new Date()), [state.workouts]);
  const completed = useMemo(() => completedStepIds(state), [state]);

  // The skill furthest along that still has a step left; otherwise the first one.
  const next = useMemo(() => {
    const all = SKILLS.map((skill) => ({ skill, progress: skillProgress(skill, completed) })).filter((s) => s.progress.nextStep);
    return all.sort((a, b) => b.progress.done - a.progress.done)[0];
  }, [completed]);

  const name = state.profile.displayName.trim();

  return (
    <Screen topInset contentStyle={{ gap: 22 }}>
      <View style={{ gap: 4 }}>
        <Eyebrow>{todayLabel(new Date())}</Eyebrow>
        <H1>{name ? `Hey, ${name}` : 'Hey, athlete'}</H1>
      </View>

      <TrialPill />

      <FrostCard>
        {access.canLog ? (
          <View style={{ gap: 4 }}>
            <Text style={s.heroKicker}>Ready when you are</Text>
            <Text style={s.heroTitle}>{"Let's get today's session in"}</Text>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            <Text style={s.heroKicker}>Your free trial has ended</Text>
            <Text style={s.heroTitle}>Your history is safe. Go Pro to keep logging.</Text>
          </View>
        )}
        <Button
          compact
          variant="navy"
          label={access.canLog ? 'Start workout →' : 'See Founder Pass →'}
          onPress={() => router.push(access.canLog ? '/workout/new' : '/paywall')}
        />
      </FrostCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat value={week.length} label={week.length === 1 ? 'workout' : 'workouts'} />
        <Stat value={countSets(week)} label="sets" />
        <Stat value={completed.size} label="skill steps" />
      </View>

      {next && (
        <View style={{ gap: space.md }}>
          <Eyebrow>Next skill</Eyebrow>
          <Card>
            <View style={s.row}>
              <Text style={s.cardTitle}>{next.skill.name}</Text>
              <Muted>
                {next.progress.done} / {next.progress.total}
              </Muted>
            </View>
            <Muted>Next: {next.progress.nextStep?.name}</Muted>
            <ProgressBar value={next.progress.done / next.progress.total} />
          </Card>
        </View>
      )}

      <View style={{ gap: space.md }}>
        <Eyebrow>Recent</Eyebrow>
        {state.workouts.length === 0 ? (
          <Muted>No workouts yet. Your first one starts your records.</Muted>
        ) : (
          state.workouts.slice(0, 2).map((w) => <WorkoutCard key={w.id} workout={w} />)
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  heroKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '500' },
  heroTitle: { fontFamily: font, color: colors.onFrost, fontSize: 22, fontWeight: '600', letterSpacing: -0.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '600' },
});
