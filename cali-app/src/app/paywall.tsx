import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressScale, Rise } from '@/components/motion';
import { Button, Card, FrostCard, H1, Muted, Screen } from '@/components/ui';
import { TRIAL_DAYS } from '@/lib/trial';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Region = 'in' | 'world';

const PRICE: Record<Region, { amount: string; label: string; perMonth: string }> = {
  in: { amount: '₹500', label: 'India', perMonth: 'about ₹42 a month' },
  world: { amount: '$10', label: 'Worldwide', perMonth: 'under $1 a month' },
};

// What Free keeps after the trial vs what the Founder Pass adds.
const COMPARE: { icon: IconName; label: string; free: boolean | string; pro: boolean | string }[] = [
  { icon: 'time-outline', label: 'Your full history', free: true, pro: true },
  { icon: 'create-outline', label: 'Log sessions', free: `${TRIAL_DAYS} days`, pro: true },
  { icon: 'ribbon-outline', label: 'Skill ladders that tick themselves', free: `${TRIAL_DAYS} days`, pro: true },
  { icon: 'podium-outline', label: 'Video-verified rankings', free: false, pro: true },
  { icon: 'trophy-outline', label: 'Monthly challenges', free: false, pro: true },
  { icon: 'sparkles-outline', label: 'Founder badge, forever', free: false, pro: true },
];

function Mark({ value, onFrost }: { value: boolean | string; onFrost?: boolean }) {
  if (typeof value === 'string') return <Text style={[s.markText, onFrost && { color: colors.onFrostMuted }]}>{value}</Text>;
  return value ? (
    <Ionicons name="checkmark-circle" size={18} color={onFrost ? colors.onFrost : colors.frost} />
  ) : (
    <Ionicons name="remove" size={18} color={colors.faint} />
  );
}

export default function PaywallScreen() {
  const { access, dev } = useAppState();
  const [region, setRegion] = useState<Region>('in');
  const price = PRICE[region];

  return (
    <Screen headerInset contentStyle={{ gap: 20 }}>
      <Rise>
        <Text style={s.kicker}>Founder Pass · launch price</Text>
        <H1 style={{ marginTop: 4 }}>{'Train without\nlimits.'}</H1>
        <Muted style={{ marginTop: 6 }}>Back us early and lock in the launch price for the whole year.</Muted>
      </Rise>

      <Rise delay={80}>
        <View style={s.toggle}>
          {(Object.keys(PRICE) as Region[]).map((r) => (
            <PressScale key={r} onPress={() => setRegion(r)} containerStyle={{ flex: 1 }} style={[s.toggleBtn, region === r && s.toggleOn]} accessibilityLabel={PRICE[r].label}>
              <Text style={[s.toggleText, region === r && { color: colors.onFrost }]}>{PRICE[r].label}</Text>
            </PressScale>
          ))}
        </View>
      </Rise>

      <Rise delay={140}>
        <FrostCard sheen>
          <View style={s.priceRow}>
            <Text style={s.price}>{price.amount}</Text>
            <View>
              <Text style={s.per}>per year</Text>
              <Text style={s.perSub}>{price.perMonth}</Text>
            </View>
          </View>
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeText}>Founder</Text>
            </View>
            <Text style={s.perSub}>Price stays yours while you renew.</Text>
          </View>
        </FrostCard>
      </Rise>

      <Rise delay={200}>
        <Card style={{ gap: 0, paddingVertical: 8 }}>
          <View style={[s.cmpRow, { borderTopWidth: 0 }]}>
            <View style={{ flex: 1 }} />
            <Text style={s.cmpHead}>Free</Text>
            <Text style={[s.cmpHead, { color: colors.text }]}>Founder</Text>
          </View>
          {COMPARE.map((row) => (
            <View key={row.label} style={s.cmpRow}>
              <Ionicons name={row.icon} size={16} color={colors.muted} />
              <Text style={s.cmpLabel}>{row.label}</Text>
              <View style={s.cmpCell}>
                <Mark value={row.free} />
              </View>
              <View style={s.cmpCell}>
                <Mark value={row.pro} />
              </View>
            </View>
          ))}
        </Card>
      </Rise>

      <Rise delay={260} style={{ gap: 10 }}>
        {access.status === 'pro' ? (
          <Button label="You're a Founder" variant="glass" icon={<Ionicons name="checkmark" size={16} color={colors.text} />} onPress={() => router.back()} />
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
        <Muted style={{ textAlign: 'center', fontSize: 12 }}>Your history always stays viewable, Pro or not.</Muted>
      </Rise>
    </Screen>
  );
}

const s = StyleSheet.create({
  kicker: { fontFamily: font, color: colors.ember, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  toggle: { flexDirection: 'row', gap: 6, padding: 5, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  toggleOn: { backgroundColor: colors.frost },
  toggleText: { fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  price: { fontFamily: display, color: colors.onFrost, fontSize: 64, lineHeight: 64, fontWeight: '700' },
  per: { fontFamily: font, color: colors.onFrost, fontSize: 16, fontWeight: '800' },
  perSub: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.onFrost, marginBottom: 6 },
  badgeText: { fontFamily: font, color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  cmpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  cmpHead: { width: 64, textAlign: 'center', fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  cmpLabel: { flex: 1, fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '600' },
  cmpCell: { width: 64, alignItems: 'center' },
  markText: { fontFamily: font, color: colors.muted, fontSize: 11, fontWeight: '800' },
});
