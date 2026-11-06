import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Rise } from '@/components/motion';
import { Backdrop, Button, Card, H1, Muted, styles } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useT } from '@/i18n';
import { countSets } from '@/lib/records';
import type { Workout } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font } from '@/theme';

/** Groups sessions by calendar month, newest first. */
function byMonth(workouts: Workout[], lang: string) {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const sections: { key: string; title: string; sets: number; data: Workout[] }[] = [];
  for (const w of sorted) {
    const d = new Date(w.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let sec = sections[sections.length - 1];
    if (!sec || sec.key !== key) {
      sec = { key, title: d.toLocaleDateString(lang, { month: 'long', year: 'numeric' }), sets: 0, data: [] };
      sections.push(sec);
    }
    sec.data.push(w);
  }
  for (const sec of sections) sec.sets = countSets(sec.data);
  return sections;
}

export default function HistoryScreen() {
  const { state, access } = useAppState();
  const insets = useSafeAreaInsets();
  const { t, lang } = useT();
  const sections = useMemo(() => byMonth(state.workouts, lang), [state.workouts, lang]);
  const total = state.workouts.length;
  const sets = countSets(state.workouts);

  return (
    <Backdrop>
      <SectionList
        style={styles.fill}
        contentContainerStyle={[styles.screenContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 48, gap: 10 }]}
        sections={sections}
        keyExtractor={(w) => w.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Rise style={{ gap: 16, marginBottom: 8 }}>
            <H1>{t('menu.history')}</H1>
            {total > 0 && (
              <Card style={s.summary}>
                <View style={s.sumCol}>
                  <Text style={s.sumNum}>{total}</Text>
                  <Text style={s.sumLabel}>{t('unit.session', { count: total })}</Text>
                </View>
                <View style={s.divider} />
                <View style={s.sumCol}>
                  <Text style={s.sumNum}>{sets}</Text>
                  <Text style={s.sumLabel}>{t('unit.set', { count: sets })}</Text>
                </View>
                <View style={s.divider} />
                <View style={s.sumCol}>
                  <Text style={s.sumNum}>{sections.length}</Text>
                  <Text style={s.sumLabel}>{t('unit.month', { count: sections.length })}</Text>
                </View>
              </Card>
            )}
          </Rise>
        }
        renderSectionHeader={({ section }) => (
          <View style={s.monthRow}>
            <Text style={s.month}>{section.title}</Text>
            <Text style={s.monthMeta}>
              {section.data.length} · {t('count.sets', { count: section.sets })}
            </Text>
          </View>
        )}
        renderItem={({ item }) => <WorkoutCard workout={item} />}
        ListEmptyComponent={
          <Rise delay={80}>
            <Card style={s.empty}>
              <Ionicons name="calendar-clear-outline" size={26} color={colors.muted} />
              <Text style={s.emptyTitle}>{t('history.empty')}</Text>
              <Muted style={{ textAlign: 'center' }}>{t('history.emptyText')}</Muted>
              {access.canLog && <Button compact label={t('home.startSession')} onPress={() => router.push('/workout/new')} />}
            </Card>
          </Rise>
        }
        showsVerticalScrollIndicator={false}
      />
    </Backdrop>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  sumCol: { flex: 1, alignItems: 'center', gap: 2 },
  sumNum: { fontFamily: display, color: colors.text, fontSize: 32, lineHeight: 34, fontWeight: '600' },
  sumLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: colors.border },
  monthRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14, marginBottom: 2 },
  month: { fontFamily: display, color: colors.text, fontSize: 22, fontWeight: '600' },
  monthMeta: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyTitle: { fontFamily: display, color: colors.text, fontSize: 24, fontWeight: '700' },
});
