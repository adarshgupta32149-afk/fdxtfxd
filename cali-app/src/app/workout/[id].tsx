import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ConfettiBurst } from '@/components/Celebration';
import { Rise, useCountUp } from '@/components/motion';
import { Button, Card, FrostCard, H1, Muted, Screen } from '@/components/ui';
import { formatDate } from '@/components/WorkoutCard';
import { getExercise } from '@/lib/exercises';
import { useT } from '@/i18n';
import * as haptics from '@/lib/haptics';
import { completedStepIds, formatSet } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font } from '@/theme';

function Stat({ value, label, delay }: { value: number; label: string; delay: number }) {
  const shown = useCountUp(value, { delay, duration: 900 });
  return (
    <View style={s.stat}>
      <Text style={s.statNum}>{shown}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { state, deleteWorkout } = useAppState();
  const { t, lang } = useT();
  const [confirm, setConfirm] = useState(false);
  const workout = state.workouts.find((w) => w.id === id);
  const justSaved = fresh === '1';

  // Skill steps this workout unlocked: done with it, not done without it.
  const unlocked = useMemo(() => {
    if (!workout) return [];
    const withIt = completedStepIds(state);
    const without = completedStepIds({ workouts: state.workouts.filter((w) => w.id !== workout.id), manualSteps: state.manualSteps });
    return SKILLS.flatMap((skill) => skill.steps.filter((st) => withIt.has(st.id) && !without.has(st.id)).map((st) => ({ skill, step: st })));
  }, [state, workout]);

  const celebrate = justSaved && unlocked.length > 0;
  const pop = useState(() => new Animated.Value(celebrate ? 0 : 1))[0];
  useEffect(() => {
    if (!celebrate) return;
    haptics.success();
    Animated.spring(pop, { toValue: 1, delay: 180, useNativeDriver: true, speed: 8, bounciness: 12 }).start();
  }, [celebrate, pop]);

  // Ember glow that breathes behind the unlock card.
  const glow = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!celebrate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [celebrate, glow]);

  if (!workout) {
    return (
      <Screen headerInset>
        <H1>{t('common.notFound')}</H1>
        <Muted>{t('session.gone')}</Muted>
      </Screen>
    );
  }

  const sets = workout.entries.reduce((n, e) => n + e.sets.length, 0);
  const reps = workout.entries.reduce((n, e) => n + e.sets.reduce((m, st) => m + (st.reps ?? 0), 0), 0);
  const holds = workout.entries.reduce((n, e) => n + e.sets.reduce((m, st) => m + (st.holdSec ?? 0), 0), 0);
  const time = new Date(workout.date).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' });

  return (
    <Screen headerInset contentStyle={{ gap: 18 }}>
      <Rise>
        <Text style={s.kicker}>{justSaved ? t('session.saved') : `${formatDate(workout.date, lang)} · ${time}`}</Text>
        <H1 style={{ marginTop: 4 }}>{justSaved ? (celebrate ? t('session.levelUp') : t('session.niceWork')) : t('session.title')}</H1>
      </Rise>

      {celebrate && (
        <View>
          <Animated.View
            pointerEvents="none"
            style={[s.glow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }]}
          />
          <Animated.View style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
            <FrostCard sheen>
              <View style={s.unlockHead}>
                <View style={s.badge}>
                  <Ionicons name="trophy" size={18} color={colors.frost} />
                </View>
                <Text style={s.unlockKicker}>{t('session.unlocked', { count: unlocked.length })}</Text>
              </View>
              <View style={{ gap: 12 }}>
                {unlocked.map(({ skill, step }) => (
                  <View key={step.id}>
                    <Text style={s.unlockSkill}>{skill.name}</Text>
                    <Text style={s.unlockStep}>{step.name}</Text>
                  </View>
                ))}
              </View>
              <Button compact variant="navy" label={t('session.seeLadder')} onPress={() => router.push({ pathname: '/skills', params: { id: unlocked[0].skill.id } })} />
            </FrostCard>
          </Animated.View>
          <ConfettiBurst />
        </View>
      )}

      {!celebrate && unlocked.length > 0 && (
        <Card style={s.unlockQuiet}>
          <Ionicons name="trophy-outline" size={18} color={colors.gold} />
          <Text style={s.unlockQuietText} numberOfLines={2}>
            Unlocked {unlocked.map((u) => u.step.name).join(', ')}
          </Text>
        </Card>
      )}

      <Rise delay={120}>
        <Card style={s.stats}>
          <Stat value={workout.entries.length} label={t('unit.exercise', { count: workout.entries.length })} delay={300} />
          <View style={s.divider} />
          <Stat value={sets} label={t('unit.set', { count: sets })} delay={380} />
          <View style={s.divider} />
          {holds > reps ? <Stat value={holds} label={t('session.secHeld')} delay={460} /> : <Stat value={reps} label={t('unit.rep', { count: reps })} delay={460} />}
        </Card>
      </Rise>

      {workout.entries.map((entry, i) => (
        <Rise key={i} delay={200 + i * 60}>
          <Card style={{ gap: 0, paddingVertical: 14 }}>
            <Text style={s.exercise}>{getExercise(entry.exerciseId)?.name ?? entry.exerciseId}</Text>
            {entry.sets.map((set, j) => (
              <View key={j} style={s.setRow}>
                <Text style={s.setNum}>{j + 1}</Text>
                <Text style={s.setVal}>{formatSet(set)}</Text>
              </View>
            ))}
          </Card>
        </Rise>
      ))}

      {justSaved ? (
        <Button label={t('common.done')} onPress={() => router.dismissTo('/')} />
      ) : (
        <Button
          label={confirm ? t('session.deleteConfirm') : t('session.delete')}
          variant="danger"
          icon={<Ionicons name="trash-outline" size={16} color={colors.danger} />}
          onPress={() => {
            if (!confirm) {
              haptics.warning();
              return setConfirm(true);
            }
            deleteWorkout(workout.id);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  kicker: { fontFamily: font, color: colors.ember, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  glow: { position: 'absolute', left: 10, right: 10, top: 20, bottom: -10, borderRadius: 40, backgroundColor: 'rgba(255,154,98,0.22)' },
  unlockHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onFrost },
  unlockKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  unlockSkill: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '700' },
  unlockStep: { fontFamily: display, color: colors.onFrost, fontSize: 32, lineHeight: 34, fontWeight: '700' },
  unlockQuiet: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unlockQuietText: { flex: 1, fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '700' },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: display, color: colors.text, fontSize: 34, lineHeight: 36, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  divider: { width: 1, height: 34, backgroundColor: colors.border },
  exercise: { fontFamily: display, color: colors.text, fontSize: 24, lineHeight: 26, fontWeight: '700', paddingBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  setNum: { fontFamily: display, color: colors.faint, fontSize: 16, fontWeight: '700', width: 18 },
  setVal: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
