import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useNow } from '@/components/hooks';
import { useLocalWeather } from '@/components/useLocalWeather';
import { WeatherCard } from '@/components/WeatherCard';
import { HubButton } from '@/components/HubButton';
import { CategoryTag } from '@/components/LearnCards';
import { articleImage, videoThumb } from '@/components/learnMedia';
import { LiveDot, PressScale, Rise, useCountUp } from '@/components/motion';
import { PosterCarousel } from '@/components/PosterCarousel';
import { useMenu } from '@/components/SideMenu';
import { Button, Card, FrostCard, H1, Muted, ProgressBar, Screen, SectionHead } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { WorkoutCard } from '@/components/WorkoutCard';
import { skillIcon } from '@/components/skillIcons';
import { ARTICLES, dailyPick, VIDEOS } from '@/lib/learn';
import { postersFor } from '@/lib/posters';
import { completedStepIds, countSets, skillProgress, workoutsThisWeek } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { clockLabel, PERIOD_COPY, periodOf } from '@/lib/time';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, panelGradient, radius } from '@/theme';

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
  const local = useLocalWeather();
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

  // One guide and one video a day from Learn, leaning toward the user's focus skills.
  const today = now.toDateString();
  const pick = useMemo(() => dailyPick(ARTICLES, new Date(today), state.focusSkills), [today, state.focusSkills]);
  const pickVideo = useMemo(() => dailyPick(VIDEOS.filter((v) => !v.short), new Date(today), state.focusSkills), [today, state.focusSkills]);

  const name = state.profile.displayName.trim();
  const sets = countSets(week);

  return (
    <Screen topInset tabBar contentStyle={{ gap: 20 }}>
      <Rise delay={0}>
        <View style={s.topbar}>
          <HubButton onPress={menu.open} />
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

      <Rise delay={110}>
        <WeatherCard data={local} now={now} />
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
        <LinearGradient colors={panelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.week}>
          <View style={s.weekHead}>
            <Text style={s.weekLabel}>This week</Text>
            <PressScale onPress={() => router.push('/history')} haptic="none" accessibilityLabel="Open history">
              <Text style={s.weekAction}>History</Text>
            </PressScale>
          </View>
          <WeekStrip workouts={state.workouts} now={now} tone="tint" />
          <View style={s.statsRow}>
            <StatNumber value={week.length} label={week.length === 1 ? 'session' : 'sessions'} delay={500} />
            <View style={s.divider} />
            <StatNumber value={sets} label={sets === 1 ? 'set' : 'sets'} delay={580} />
            <View style={s.divider} />
            <StatNumber value={completed.size} label={completed.size === 1 ? 'skill step' : 'skill steps'} delay={660} />
          </View>
        </LinearGradient>
      </Rise>

      {next && (
        <Rise delay={350}>
          <PressScale onPress={() => router.push({ pathname: '/skills', params: { id: next.skill.id } })} scaleTo={0.98}>
            <Card>
              <SectionHead label={state.focusSkills.includes(next.skill.id) ? 'Your focus' : 'Next skill'} />
              <View style={s.skillRow}>
                <View style={s.skillIcon}>
                  <Ionicons name={skillIcon(next.skill.id)} size={18} color={colors.onFrost} />
                </View>
                <Text style={[s.skillName, { flex: 1 }]}>{next.skill.name}</Text>
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

      {pick && (
        <Rise delay={400} style={{ gap: 12 }}>
          <SectionHead label="Today's pick" action="Learn" onAction={() => router.push('/learn')} />
          <PressScale onPress={() => router.push({ pathname: '/learn/[id]', params: { id: pick.id } })} scaleTo={0.98} accessibilityLabel={`Read ${pick.title}`}>
            <View style={s.pick}>
              <Image source={articleImage(pick.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['rgba(7,11,22,0.1)', 'rgba(7,11,22,0.94)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
              <View style={s.pickTop}>
                <CategoryTag category={pick.category} onImage />
              </View>
              <View style={s.pickBottom}>
                <Text style={s.pickTitle} numberOfLines={2}>
                  {pick.title}
                </Text>
                <Text style={s.pickMeta}>
                  {pick.source} · {pick.minutes} min read
                </Text>
              </View>
            </View>
          </PressScale>
          {pickVideo && (
            <PressScale
              onPress={() => router.push({ pathname: '/learn/video/[id]', params: { id: pickVideo.id } })}
              scaleTo={0.98}
              style={s.pickVideo}
              accessibilityLabel={`Watch ${pickVideo.title}`}
            >
              <Image source={videoThumb(pickVideo.id)} style={s.pickVideoThumb} />
              <View style={s.pickVideoPlay}>
                <Ionicons name="play" size={11} color={colors.onFrost} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.pickVideoKicker}>Watch · {pickVideo.length}</Text>
                <Text style={s.pickVideoTitle} numberOfLines={1}>
                  {pickVideo.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
            </PressScale>
          )}
        </Rise>
      )}

      <Rise delay={460} style={{ gap: 12 }}>
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
  week: { borderRadius: radius.lg, padding: 18, gap: 18, borderWidth: 1, borderColor: 'rgba(158,194,255,0.2)' },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekLabel: { fontFamily: font, color: colors.glow, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  weekAction: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  skillIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glow },
  pick: { height: 210, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navyPanel, borderWidth: 1, borderColor: colors.border },
  pickTop: { position: 'absolute', top: 14, left: 14 },
  pickBottom: { position: 'absolute', left: 16, right: 16, bottom: 14, gap: 4 },
  pickTitle: { fontFamily: display, color: colors.text, fontSize: 28, lineHeight: 30, fontWeight: '700' },
  pickMeta: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '700' },
  pickVideo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  pickVideoThumb: { width: 72, height: 44, borderRadius: 9 },
  pickVideoPlay: { position: 'absolute', left: 39, top: 23, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frostHi },
  pickVideoKicker: { fontFamily: font, color: colors.ember, fontSize: 11, fontWeight: '800' },
  pickVideoTitle: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '700' },
  statNum: { fontFamily: display, color: colors.text, fontSize: 36, lineHeight: 38, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  divider: { width: 1, height: 34, backgroundColor: 'rgba(158,194,255,0.22)' },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillName: { fontFamily: display, color: colors.text, fontSize: 30, lineHeight: 32, fontWeight: '600' },
  skillFrac: { fontFamily: display, color: colors.muted, fontSize: 20, fontWeight: '600' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md },
});
