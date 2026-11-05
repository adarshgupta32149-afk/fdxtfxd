import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useNow } from '@/components/hooks';
import { LiveDot, Rise } from '@/components/motion';
import { Button, Card, Eyebrow, FrostCard, H1, Muted, Screen, SectionHead } from '@/components/ui';
import { useLeaderboard } from '@/components/useLeaderboard';
import { challengeFor } from '@/lib/boards';
import { pad2, untilMonthEnd } from '@/lib/time';
import { colors, display, font } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'videocam-outline', title: 'Film one attempt', body: 'One continuous clip, whole body in frame, from start to last rep.' },
  { icon: 'cloud-upload-outline', title: 'Submit it in the app', body: 'Your score goes in as pending. Nobody sees it until it is checked.' },
  { icon: 'checkmark-done-outline', title: 'Get verified', body: 'Clean reps count. Verified scores go straight onto the board.' },
];

function TimeBox({ value, label, live }: { value: string; label: string; live?: boolean }) {
  return (
    <View style={s.timeBox}>
      <Text style={[s.timeNum, live && { color: colors.ember }]}>{value}</Text>
      <Text style={s.timeLabel}>{label}</Text>
    </View>
  );
}

export default function CompeteScreen() {
  const now = useNow(1000);
  const challenge = challengeFor(now);
  const left = untilMonthEnd(now);
  const month = now.toLocaleDateString(undefined, { month: 'long' });
  const { rows, error } = useLeaderboard(challenge.id, 3);

  return (
    <Screen topInset tabBar contentStyle={{ gap: 18 }}>
      <Rise>
        <View style={s.liveRow}>
          <LiveDot color={colors.ember} />
          <Eyebrow style={{ color: colors.ember }}>Live · {month}</Eyebrow>
        </View>
        <H1 style={{ marginTop: 6 }}>Compete</H1>
      </Rise>

      <Rise delay={80}>
        <FrostCard sheen style={{ gap: 14 }}>
          <Text style={s.kicker}>{month.toUpperCase()} CHALLENGE</Text>
          <Text style={s.challenge}>{challenge.label}</Text>
          <Text style={s.sub}>One attempt, on video. Ends at midnight on the last day of {month}.</Text>
          <View style={s.timer}>
            <TimeBox value={String(left.days)} label="days" />
            <TimeBox value={pad2(left.hours)} label="hours" />
            <TimeBox value={pad2(left.minutes)} label="min" />
            <TimeBox value={pad2(left.seconds)} label="sec" live />
          </View>
        </FrostCard>
      </Rise>

      <Rise delay={150}>
        <Button label="Submissions open soon" variant="glass" disabled onPress={() => {}} icon={<Ionicons name="lock-closed" size={14} color={colors.text} />} />
      </Rise>

      <Rise delay={210} style={{ gap: 12 }}>
        <SectionHead label="How it works" />
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={[s.step, i > 0 && s.stepLine]}>
              <View style={s.stepIcon}>
                <Ionicons name={step.icon} size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.stepTitle}>
                  {i + 1}. {step.title}
                </Text>
                <Muted style={{ fontSize: 13 }}>{step.body}</Muted>
              </View>
            </View>
          ))}
        </Card>
      </Rise>

      <Rise delay={270} style={{ gap: 12 }}>
        <SectionHead label="Current standings" />
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {rows.length > 0 ? (
            rows.map((r, i) => (
              <View key={`${r.rank}-${r.display_name}`} style={[s.row, i > 0 && s.stepLine]}>
                <Text style={s.rank}>{r.rank}</Text>
                <Text style={s.person}>{r.display_name}</Text>
                <Text style={s.score}>{challenge.unit(r.value)}</Text>
              </View>
            ))
          ) : (
            <View style={s.row}>
              <Ionicons name={error ? 'cloud-offline-outline' : 'flag-outline'} size={18} color={error ? colors.muted : colors.ember} />
              <Muted style={{ flex: 1 }}>{error ?? 'No entries yet. The board is wide open.'}</Muted>
            </View>
          )}
        </Card>
      </Rise>

      <Rise delay={330}>
        <Card style={s.prize}>
          <Ionicons name="trophy" size={22} color={colors.gold} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.stepTitle}>Winners keep a trophy</Text>
            <Muted style={{ fontSize: 13 }}>The top three each month get a permanent trophy on their profile.</Muted>
          </View>
        </Card>
      </Rise>
    </Screen>
  );
}

const s = StyleSheet.create({
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  challenge: { fontFamily: display, color: colors.onFrost, fontSize: 40, lineHeight: 40, fontWeight: '700' },
  sub: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  timer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  timeBox: { flex: 1, backgroundColor: colors.navy, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  timeNum: { fontFamily: display, color: colors.text, fontSize: 28, lineHeight: 30, fontWeight: '600', fontVariant: ['tabular-nums'] },
  timeLabel: { fontFamily: font, color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 14, alignItems: 'flex-start' },
  stepLine: { borderTopWidth: 1, borderTopColor: colors.border },
  stepIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  stepTitle: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rank: { width: 26, fontFamily: display, color: colors.gold, fontSize: 20, fontWeight: '700' },
  person: { flex: 1, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600' },
  score: { fontFamily: display, color: colors.text, fontSize: 20, fontWeight: '600' },
  prize: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
