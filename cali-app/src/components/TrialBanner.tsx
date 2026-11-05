import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { TRIAL_DAYS } from '@/lib/trial';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, frostGradient, radius } from '@/theme';
import { PressScale } from './motion';

/** Plan card for Profile: a frosted panel with the trial countdown, or the Founder badge. */
export function TrialBanner() {
  const { access } = useAppState();

  if (access.status === 'pro') {
    return (
      <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.frost}>
        <View style={s.row}>
          <Ionicons name="sparkles" size={16} color={colors.onFrost} />
          <Text style={s.kicker}>Founder · Pro</Text>
        </View>
        <Text style={s.title}>Unlimited logging</Text>
        <Text style={s.text}>Thanks for backing us early.</Text>
      </LinearGradient>
    );
  }

  const expired = access.status === 'expired';
  const used = 1 - access.daysLeft / TRIAL_DAYS;
  return (
    <PressScale onPress={() => router.push('/paywall')} scaleTo={0.98} accessibilityLabel="See the Founder Pass">
      <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.frost}>
        <Text style={s.kicker}>{expired ? 'Trial ended' : 'Free trial'}</Text>
        <View style={s.row}>
          <Text style={s.big}>{expired ? '0' : access.daysLeft}</Text>
          <Text style={s.bigUnit}>{access.daysLeft === 1 ? 'day left' : 'days left'}</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.max(0, Math.min(1, used)) * 100}%` }]} />
        </View>
        <Text style={s.text}>
          {expired ? 'Your history is all still here. Go Pro to keep logging.' : 'Everything is unlocked until then. History stays yours after.'}
        </Text>
        <View style={s.row}>
          <Text style={s.link}>See the Founder Pass</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.onFrost} />
        </View>
      </LinearGradient>
    </PressScale>
  );
}

const s = StyleSheet.create({
  frost: { borderRadius: radius.lg, padding: 20, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontFamily: display, color: colors.onFrost, fontSize: 30, fontWeight: '700' },
  big: { fontFamily: display, color: colors.onFrost, fontSize: 52, lineHeight: 54, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bigUnit: { fontFamily: font, color: colors.onFrostMuted, fontSize: 15, fontWeight: '700', marginTop: 14 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(11,19,36,0.12)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.onFrost },
  text: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  link: { fontFamily: font, color: colors.onFrost, fontSize: 14, fontWeight: '800' },
});
