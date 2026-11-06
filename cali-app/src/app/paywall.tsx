import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressScale, Rise } from '@/components/motion';
import { Button, Card, FrostCard, H1, Muted, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { TRIAL_DAYS } from '@/lib/trial';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Region = 'in' | 'world';

const PRICE: Record<Region, { amount: string }> = {
  in: { amount: '₹500' },
  world: { amount: '$10' },
};

// What Free keeps after the trial vs what the Founder Pass adds.
// 'trial' means: included during the free trial only.
const COMPARE: { icon: IconName; id: string; free: boolean | 'trial'; pro: boolean }[] = [
  { icon: 'time-outline', id: 'history', free: true, pro: true },
  { icon: 'create-outline', id: 'log', free: 'trial', pro: true },
  { icon: 'ribbon-outline', id: 'ladders', free: 'trial', pro: true },
  { icon: 'podium-outline', id: 'rankings', free: false, pro: true },
  { icon: 'trophy-outline', id: 'challenges', free: false, pro: true },
  { icon: 'sparkles-outline', id: 'badge', free: false, pro: true },
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
  const { t } = useT();
  const [region, setRegion] = useState<Region>('in');
  const price = PRICE[region];

  return (
    <Screen headerInset contentStyle={{ gap: 20 }}>
      <Rise>
        <Text style={s.kicker}>{t('pass.kicker')}</Text>
        <H1 style={{ marginTop: 4 }}>{t('pass.title')}</H1>
        <Muted style={{ marginTop: 6 }}>{t('pass.intro')}</Muted>
      </Rise>

      <Rise delay={80}>
        <View style={s.toggle}>
          {(Object.keys(PRICE) as Region[]).map((r) => (
            <PressScale key={r} onPress={() => setRegion(r)} containerStyle={{ flex: 1 }} style={[s.toggleBtn, region === r && s.toggleOn]} accessibilityLabel={t(`pass.region.${r}` as Key)}>
              <Text style={[s.toggleText, region === r && { color: colors.onFrost }]}>{t(`pass.region.${r}` as Key)}</Text>
            </PressScale>
          ))}
        </View>
      </Rise>

      <Rise delay={140}>
        <FrostCard sheen>
          <View style={s.priceRow}>
            <Text style={s.price}>{price.amount}</Text>
            <View>
              <Text style={s.per}>{t('pass.perYear')}</Text>
              <Text style={s.perSub}>{t(`pass.perMonth.${region}` as Key)}</Text>
            </View>
          </View>
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{t('pass.founder')}</Text>
            </View>
            <Text style={s.perSub}>{t('pass.priceStays')}</Text>
          </View>
        </FrostCard>
      </Rise>

      <Rise delay={200}>
        <Card style={{ gap: 0, paddingVertical: 8 }}>
          <View style={[s.cmpRow, { borderTopWidth: 0 }]}>
            <View style={{ flex: 1 }} />
            <Text style={s.cmpHead}>{t('pass.free')}</Text>
            <Text style={[s.cmpHead, { color: colors.text }]}>{t('pass.founder')}</Text>
          </View>
          {COMPARE.map((row) => (
            <View key={row.id} style={s.cmpRow}>
              <Ionicons name={row.icon} size={16} color={colors.muted} />
              <Text style={s.cmpLabel}>{t(`pass.cmp.${row.id}` as Key)}</Text>
              <View style={s.cmpCell}>
                <Mark value={row.free === 'trial' ? t('pass.nDays', { count: TRIAL_DAYS }) : row.free} />
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
          <Button label={t('pass.youreFounder')} variant="glass" icon={<Ionicons name="checkmark" size={16} color={colors.text} />} onPress={() => router.back()} />
        ) : __DEV__ ? (
          <Button
            label="Simulate purchase (dev only)"
            onPress={() => {
              dev.setPro(true);
              router.back();
            }}
          />
        ) : (
          <Button label={t('pass.checkoutSoon')} disabled onPress={() => {}} />
        )}
        <Muted style={{ textAlign: 'center', fontSize: 12 }}>{t('pass.historyStays')}</Muted>
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
