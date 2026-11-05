import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useNow } from '@/components/hooks';
import { LiveDot, PressScale, Rise, useCountUp } from '@/components/motion';
import { PosterCarousel } from '@/components/PosterCarousel';
import { useMenu } from '@/components/SideMenu';
import { Button, Card, FrostCard, H1, Muted, ProgressBar, Screen, SectionHead } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { WorkoutCard } from '@/components/WorkoutCard';
import { postersFor } from '@/lib/posters';
import { completedStepIds, countSets, skillProgress, workoutsThisWeek } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { clockLabel, PERIOD_COPY, periodOf } from '@/lib/time';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, radius } from '@/theme';

function StatNumber({ value, label, delay }: { value: number; label: string; delay: number }) {
  const shown = useCountUp(value, { delay });
  return (
    <View style={s.statCol}>
      <Text style={s.statNum}>{shown}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { state, access } = useAppState();
  const menu = useMenu();
  const now = useNow(1000);
  const period = periodOf(now);
  const copy = PERIOD_COPY[period];
  const posters = useMemo(() => postersFor(period), [period]);

  const week = useMemo(() => workoutsThisWeek(state.workouts, now), [state.workouts, now]);
  const completed = useMemo(() => completedStepIds(state), [state]);

  // Lead with a skill the user chose; otherwise the one they're furthest along.
  const next = useMemo(() => {
    const all = SKILLS.map((skill) => ({ skill, progress: skillProgress(skill, completed) })).filter((x) => x.progress.nextStep);
    const focus = state.focusSkills.map((id) => all.find((x) => x.skill.id === id)).find(Boolean);
    return focus ?? all.sort((a, b) => b.progress.done - a.progress.done)[0];
  }, [completed, state.focusSkills]);

  const name = state.profile.displayName.trim();
  const sets = countSets(week);

  return (
    <Screen topInset tabBar contentStyle={{ gap: 20 }}>
      <Rise delay={0}>
        <View style={s.topbar}>
          <PressScale onPress={menu.open} style={s.iconBtn} accessibilityLabel="Open menu">
            <Ionicons name="menu" size={20} color={colors.text} />
          </PressScale>
          <PressScale onPress={() => router.push('/profile')} style={s.avatar} accessibilityLabel="Profile">
            <Text style={s.avatarText}>{(name[0] ?? 'C').toUpperCase()}</Text>
          </PressScale>
        </View>
      </Rise>

      <Rise delay={70}>
        <View style={s.clockRow}>
          <LiveDot color={colors.ember} />
          <Text style={s.clock}>{clockLabel(now)}</Text>
        </View>
        <H1 style={{ marginTop: 6 }}>{name ? `${copy.hello}${period === 'night' ? '' : ','}` : copy.hello}</H1>
        {name && period !== 'night' ? <H1 style={{ color: colors.muted }}>{name}</H1> : null}
      </Rise>

      <Rise delay={140}>
        {/* Keyed by part of the day, so it starts fresh at the first poster when evening turns into night. */}
        <PosterCarousel key={period} posters={posters} period={period} />
      </Rise>

      <Rise delay={210}>
        <FrostCard sheen>
          <View style={{ gap: 4 }}>
            <Text style={s.heroKicker}>{access.canLog ? copy.kicker : 'Your free trial has ended'}</Text>
            <Text style={s.heroTitle}>{access.canLog ? copy.title : 'Your history is safe. Go Pro to keep logging.'}</Text>
          </View>
          <View style={s.heroRow}>
            <Button
              compact
              variant="navy"
              label={access.canLog ? 'Start session' : 'See Founder Pass'}
              icon={<Ionicons name={access.canLog ? 'play' : 'sparkles'} size={14} color={colors.text} />}
              onPress={() => router.push(access.canLog ? '/workout/new' : '/paywall')}
            />
            {access.status === 'trial' && (
              <Text style={s.trialNote}>
                {access.daysLeft} {access.daysLeft === 1 ? 'day' : 'days'} of trial left
              </Text>
            )}
          </View>
        </FrostCard>
      </Rise>

      <Rise delay={280}>
        <Card style={{ gap: 18 }}>
          <SectionHead label="This week" action="History" onAction={() => router.push('/history')} />
          <WeekStrip workouts={state.workouts} now={now} />
          <View style={s.statsRow}>
            <StatNumber value={week.length} label={week.length === 1 ? 'session' : 'sessions'} delay={500} />
            <View style={s.divider} />
            <StatNumber value={sets} label={sets === 1 ? 'set' : 'sets'} delay={580} />
            <View style={s.divider} />
            <StatNumber value={completed.size} label={completed.size === 1 ? 'skill step' : 'skill steps'} delay={660} />
          </View>
        </Card>
      </Rise>

      {next && (
        <Rise delay={350}>
          <PressScale onPress={() => router.push({ pathname: '/skills', params: { id: next.skill.id } })} scaleTo={0.98}>
            <Card>
              <SectionHead label={state.focusSkills.includes(next.skill.id) ? 'Your focus' : 'Next skill'} />
              <View style={s.skillRow}>
                <Text style={s.skillName}>{next.skill.name}</Text>
                <Text style={s.skillFrac}>
                  {next.progress.done}/{next.progress.total}
                </Text>
              </View>
              <ProgressBar value={next.progress.done / next.progress.total} delay={700} />
              <View style={s.nextRow}>
                <Ionicons name="arrow-forward-circle" size={18} color={colors.ember} />
                <Muted style={{ flex: 1 }}>Next: {next.progress.nextStep?.name}</Muted>
              </View>
            </Card>
          </PressScale>
        </Rise>
      )}

      <Rise delay={420} style={{ gap: 12 }}>
        <SectionHead label="Recent" action={state.workouts.length > 2 ? 'See all' : undefined} onAction={() => router.push('/history')} />
        {state.workouts.length === 0 ? (
          <Card style={s.empty}>
            <Ionicons name="barbell-outline" size={22} color={colors.muted} />
            <Muted style={{ flex: 1 }}>No sessions yet. Your first one starts your records and the week strip above.</Muted>
          </Card>
        ) : (
          state.workouts.slice(0, 2).map((w) => <WorkoutCard key={w.id} workout={w} />)
        )}
      </Rise>
    </Screen>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },
  avatarText: { fontFamily: display, color: colors.onFrost, fontSize: 22, fontWeight: '700' },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clock: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', fontVariant: ['tabular-nums'] },
  heroKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '700' },
  heroTitle: { fontFamily: font, color: colors.onFrost, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  trialNote: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: display, color: colors.text, fontSize: 36, lineHeight: 38, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  divider: { width: 1, height: 34, backgroundColor: colors.border },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  skillName: { fontFamily: display, color: colors.text, fontSize: 30, lineHeight: 32, fontWeight: '600' },
  skillFrac: { fontFamily: display, color: colors.muted, fontSize: 20, fontWeight: '600' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md },
});
