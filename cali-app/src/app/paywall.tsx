import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, H1, Muted, Screen } from '@/components/ui';
import { useAppState } from '@/state/AppStateProvider';
import { colors, space } from '@/theme';

const PERKS = [
  'Unlimited workout logging after the free trial',
  'Video-verified city and world leaderboards',
  'Yearly challenges and prizes',
  'AI coach that knows your records (coming soon)',
  'Founder badge, forever',
];

export default function PaywallScreen() {
  const { access, dev } = useAppState();

  return (
    <Screen>
      <H1>Founder Pass</H1>
      <Body>Early supporters get Pro at launch pricing for the whole year.</Body>

      <Card style={{ borderColor: colors.gold }}>
        {PERKS.map((perk) => (
          <View key={perk} style={s.perk}>
            <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
            <Body style={{ flex: 1 }}>{perk}</Body>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={s.price}>₹500 / year</Text>
        <Muted>India launch price</Muted>
        <Text style={[s.price, { marginTop: space.sm }]}>$10 / year</Text>
        <Muted>Worldwide launch price</Muted>
      </Card>

      <Muted>Your history always stays viewable, Pro or not.</Muted>

      {access.status === 'pro' ? (
        <Button label="You're a Founder ✓" variant="secondary" onPress={() => router.back()} />
      ) : __DEV__ ? (
        <Button
          label="Simulate purchase (dev only)"
          variant="gold"
          onPress={() => {
            dev.setPro(true);
            router.back();
          }}
        />
      ) : (
        <Button label="Checkout opens at launch" variant="gold" disabled onPress={() => {}} />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  perk: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  price: { color: colors.text, fontSize: 26, fontWeight: '800' },
});
