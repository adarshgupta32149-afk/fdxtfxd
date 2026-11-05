import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Eyebrow, FrostCard, H1, Muted, Screen } from '@/components/ui';
import { useAppState } from '@/state/AppStateProvider';
import { colors, font, space } from '@/theme';

const PERKS = [
  'Unlimited logging after the free trial',
  'Video-verified city and world leaderboards',
  'Yearly challenges and prizes',
  'AI coach that knows your records (coming soon)',
  'Founder badge, forever',
];

export default function PaywallScreen() {
  const { access, dev } = useAppState();

  return (
    <Screen contentStyle={{ gap: 22 }}>
      <View style={{ gap: 6 }}>
        <Eyebrow>Founder Pass</Eyebrow>
        <H1>Train without limits</H1>
        <Muted>Early supporters get Pro at launch pricing for the whole year.</Muted>
      </View>

      <FrostCard>
        <View style={s.priceRow}>
          <View>
            <Text style={s.price}>₹500</Text>
            <Text style={s.per}>per year · India</Text>
          </View>
          <View style={s.split} />
          <View>
            <Text style={s.price}>$10</Text>
            <Text style={s.per}>per year · worldwide</Text>
          </View>
        </View>
      </FrostCard>

      <Card style={{ gap: 14 }}>
        {PERKS.map((perk) => (
          <View key={perk} style={s.perk}>
            <Ionicons name="checkmark" size={18} color={colors.frost} />
            <Text style={s.perkText}>{perk}</Text>
          </View>
        ))}
      </Card>

      <Muted style={{ textAlign: 'center' }}>Your history always stays viewable, Pro or not.</Muted>

      {access.status === 'pro' ? (
        <Button label="You're a Founder ✓" variant="glass" onPress={() => router.back()} />
      ) : __DEV__ ? (
        <Button
          label="Simulate purchase (dev only)"
          onPress={() => {
            dev.setPro(true);
            router.back();
          }}
        />
      ) : (
        <Button label="Checkout opens at launch" disabled onPress={() => {}} />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  split: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(11,19,36,0.15)' },
  price: { fontFamily: font, color: colors.onFrost, fontSize: 30, fontWeight: '600', letterSpacing: -0.8 },
  per: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '500' },
  perk: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  perkText: { fontFamily: font, color: colors.text, fontSize: 15, flex: 1 },
});
