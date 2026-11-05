import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { TRIAL_DAYS } from '@/lib/trial';
import { useAppState } from '@/state/AppStateProvider';
import { colors, font, radius, space } from '@/theme';
import { Pill, ProgressBar } from './ui';

/** One-line trial status for the top of a screen. */
export function TrialPill() {
  const { access } = useAppState();
  if (access.status === 'pro') return <Pill label="Founder · Pro" dotColor={colors.gold} />;
  if (access.status === 'expired') return <Pill label="Trial ended · history still here" dotColor={colors.danger} onPress={() => router.push('/paywall')} />;
  return <Pill label={`Free trial · ${access.daysLeft} ${access.daysLeft === 1 ? 'day' : 'days'} left`} onPress={() => router.push('/paywall')} />;
}

/** Fuller trial card with a countdown bar, for Profile. */
export function TrialBanner() {
  const { access } = useAppState();

  if (access.status === 'pro') {
    return (
      <Pressable style={s.box}>
        <Text style={[s.title, { color: colors.gold }]}>Founder · Pro</Text>
        <Text style={s.text}>Unlimited logging. Thanks for backing us early.</Text>
      </Pressable>
    );
  }

  const expired = access.status === 'expired';
  return (
    <Pressable onPress={() => router.push('/paywall')} style={({ pressed }) => [s.box, pressed && { opacity: 0.85 }]}>
      <Text style={[s.title, expired && { color: colors.danger }]}>
        {expired ? 'Your free trial has ended' : `Free trial · ${access.daysLeft} ${access.daysLeft === 1 ? 'day' : 'days'} left`}
      </Text>
      {expired ? (
        <Text style={s.text}>All your history is still here. Go Pro to keep logging and unlock rankings.</Text>
      ) : (
        <ProgressBar value={access.daysLeft / TRIAL_DAYS} />
      )}
      <Text style={s.link}>See the Founder Pass →</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.card, borderRadius: radius.md, padding: 18, gap: space.md, borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '600' },
  text: { fontFamily: font, color: colors.muted, fontSize: 14, lineHeight: 20 },
  link: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '600' },
});
