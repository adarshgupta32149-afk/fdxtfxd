import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TRIAL_DAYS } from '@/lib/trial';
import { useAppState } from '@/state/AppStateProvider';
import { colors, radius, space } from '@/theme';
import { ProgressBar } from './ui';

export function TrialBanner() {
  const { access } = useAppState();

  if (access.status === 'pro') {
    return (
      <View style={[styles.box, { borderColor: colors.gold }]}>
        <Text style={[styles.title, { color: colors.gold }]}>PRO · Founder</Text>
        <Text style={styles.text}>Unlimited logging. Thanks for backing us early.</Text>
      </View>
    );
  }

  if (access.status === 'expired') {
    return (
      <Pressable onPress={() => router.push('/paywall')} style={[styles.box, { borderColor: colors.danger }]}>
        <Text style={[styles.title, { color: colors.danger }]}>Your free trial has ended</Text>
        <Text style={styles.text}>All your history is still here. Go Pro to keep logging and unlock rankings.</Text>
        <Text style={[styles.link, { color: colors.danger }]}>See Founder Pass →</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push('/paywall')} style={styles.box}>
      <Text style={styles.title}>
        Free trial · {access.daysLeft} {access.daysLeft === 1 ? 'day' : 'days'} left
      </Text>
      <ProgressBar value={access.daysLeft / TRIAL_DAYS} />
      <Text style={styles.link}>Lock in the Founder Pass →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  text: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  link: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});
