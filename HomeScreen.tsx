import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { clockLabel, periodOf } from '@/lib/time';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, panelGradient, radius } from '@/theme';

// Reusable stat row component
function StatRow({ value, label, delay }: { value: number; label: string; delay: number }) {
  const shown = useCountUp(value, { delay });
  return (
    <View style={statStyles.statCol}>
      <Text style={statStyles.statNum}>{shown}</Text>
      <Text style={statStyles.statLabel}>{label}</Text>
    </View>
  );
}

// Reusable intro section component
function IntroSection({ title, greeting, name, period }: { title: string; greeting?: string; name?: string; period?: string }) {
  return (
    <Rise delay={70}>
      <View style={introStyles.clockRow}>
        <LiveDot color={colors.ember} />
        <Text style={introStyles.clock}>{period}</Text>
      </View>
      <H1 style={{ marginTop: 6 }}>{greeting || title}</H1>
      {name && period !== 'night' ? <H1 style={{ color: colors.muted }}>{name}</H1> : null}
    </Rise>
  );
}

// Reusable hero card component
function HeroCard({ title, kicker, trialDaysLeft, canLog, onStart, onSee }: { title: string; kicker: string; trialDaysLeft?: number; canLog: boolean; onStart: () => void; onSee: () => void }) {
  return (
    <Rise delay={140}>
      <FrostCard sheen>
        <View style={{ gap: 4 }}>
          <Text style={heroStyles.heroKicker}>{canLog ? kicker : t('home.trialEnded')}</Text>
          <Text style={heroStyles.heroTitle}>{canLog ? title : t('home.historySafe')}</Text>
        </View>
        <View style={heroStyles.heroRow}>
          <Button
            compact
            variant="navy"
            label={canLog ? t('home.startSession') : t('pass.see')}
            icon={<Ionicons name={canLog ? 'play' : 'sparkles'} size={14} color={colors.text} />}
            onPress={onStart}
          />
          {trialDaysLeft !== undefined && (
            <Text style={heroStyles.trialNote}>
              {t('pass.daysLeft', { count: trialDaysLeft })}
            </Text>
          )}
        </View>
      </FrostCard>
    </Rise>
  );
}

// Reusable weekly stats component
function WeeklyStats({ week, sets, completed }: { week: Workout[]; sets: number; completed: Set<string> }) {
  const totalSessions = week.length;
  return (
    <Rise delay={280}>
      <LinearGradient colors={panelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={weeklyStyles.week}>
        <View style={weeklyStyles.weekHead}>
          <Text style={weeklyStyles.weekLabel}>{t('home.thisWeek')}</Text>
          <PressScale onPress={() => router.push('/history')} haptic="none" accessibilityLabel={t('menu.history')}>
            <Text style={weeklyStyles.weekAction}>{t('menu.history')}</Text>
          </PressScale>
        </View>
        <WeekStrip workouts={week} now={new Date()} tone="tint" />
        <View style={weeklyStyles.statsRow}>
          <StatRow value={totalSessions} label={t('unit.session', { count: totalSessions })} delay={500} />
          <View style={weeklyStyles.divider} />
          <StatRow value={sets} label={t('unit.set', { count: sets })} delay={580} />
          <View style={weeklyStyles.divider} />
          <StatRow value={completed.size} label={t('unit.skillStep', { count: completed.size })} delay={660} />
        </View>
      </LinearGradient>
    </Rise>
  );
}

// Reusable next skill card component
function NextSkillCard({ next, onStart }: { next?: { skill: Skill; progress: SkillProgress }; onStart: () => void }) {
  if (!next) return null;
  return (
    <Rise delay={350}>
      <PressScale onPress={() => router.push({ pathname: '/skills', params: { id: next.skill.id } })} scaleTo={0.98}>
        <Card>
          <SectionHead label={t('home.yourFocus')} />
          <View style={nextStyles.skillRow}>
            <View style={nextStyles.skillIcon}>
              <Ionicons name={skillIcon(next.skill.id)} size={18} color={colors.onFrost} />
            </View>
            <Text style={[nextStyles.skillName, { flex: 1 }]}>{next.skill.name}</Text>
            <Text style={nextStyles.skillFrac}>{next.progress.done}/{next.progress.total}</Text>
          </View>
          <ProgressBar value={next.progress.done / next.progress.total} delay={700} />
          <View style={nextStyles.nextRow}>
            <Ionicons name="arrow-forward-circle" size={18} color={colors.ember} />
            <Muted style={{ flex: 1 }}>{t('home.next', { step: next.progress.nextStep?.name ?? '' })}</Muted>
          </View>
        </Card>
      </PressScale>
    </Rise>
  );
}

// Reusable today’s pick section component
function TodayPick({ pick, pickVideo, onStartArticle, onStartVideo }: { pick?: Article; pickVideo?: Video; onStartArticle: () => void; onStartVideo: () => void }) {
  if (!pick) return null;
  return (
    <Rise delay={400} style={{ gap: 12 }}>
      <SectionHead label={t('home.todaysPick')} action={t('tabs.learn')} onAction={() => router.push('/learn')} />
      <PressScale onPress={() => router.push({ pathname: '/learn/[id]', params: { id: pick.id } })} scaleTo={0.98} accessibilityLabel={`${t('learn.read')}: ${pick.title}`}>
        <View style={pickStyles.pick}>
          <Image source={articleImage(pick.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(7,11,22,0.1)', 'rgba(7,11,22,0.94)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
          <View style={pickStyles.pickTop}>
            <CategoryTag category={pick.category} onImage />
          </View>
          <View style={pickStyles.pickBottom}>
            <Text style={pickStyles.pickTitle} numberOfLines={2}>
              {pick.title}
            </Text>
            <Text style={pickStyles.pickMeta}>{pick.source} · {t('learn.minRead', { count: pick.minutes })}</Text>
          </View>
        </View>
      </PressScale>
      {pickVideo && (
        <PressScale
          onPress={() => router.push({ pathname: '/learn/video/[id]', params: { id: pickVideo
