import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Rise } from '@/components/motion';
import { Podium } from '@/components/Podium';
import { Card, Chip, Eyebrow, FrostCard, H1, Muted, Screen, SectionHead } from '@/components/ui';
import { useLeaderboard } from '@/components/useLeaderboard';
import { BOARDS, type BoardId } from '@/lib/boards';
import { computeRecords } from '@/lib/records';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font } from '@/theme';

export default function RankingScreen() {
  const { state } = useAppState();
  const [boardId, setBoardId] = useState<BoardId>('max_pull_ups');
  const board = BOARDS.find((b) => b.id === boardId)!;
  const { rows, loading, error, available } = useLeaderboard(boardId, 25);
  const records = useMemo(() => computeRecords(state.workouts), [state.workouts]);
  const mine = board.mine(records[board.exerciseId]);
  const myName = state.profile.displayName.trim() || 'You';
  const rest = rows.filter((r) => r.rank > 3);

  return (
    <Screen topInset tabBar contentStyle={{ gap: 18 }}>
      <Rise>
        <Eyebrow>World · verified scores</Eyebrow>
        <H1 style={{ marginTop: 6 }}>Ranking</H1>
      </Rise>

      <Rise delay={60}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -22 }}>
          <View style={{ width: 14 }} />
          {BOARDS.map((b) => (
            <Chip key={b.id} label={b.short} active={b.id === boardId} onPress={() => setBoardId(b.id)} />
          ))}
          <View style={{ width: 14 }} />
        </ScrollView>
      </Rise>

      <Rise delay={120}>
        <View style={s.boardTitleRow}>
          <Text style={s.boardTitle}>{board.label}</Text>
          {loading && <ActivityIndicator size="small" color={colors.muted} />}
        </View>
      </Rise>

      <Podium rows={rows} board={board} />

      {error && (
        <Card style={s.notice}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.muted} />
          <Muted style={{ flex: 1 }}>{error}</Muted>
        </Card>
      )}

      {!error && !loading && available && rows.length === 0 && (
        <Card style={s.notice}>
          <Ionicons name="flag-outline" size={20} color={colors.ember} />
          <Muted style={{ flex: 1 }}>No verified scores on this board yet. The first person to submit takes the top spot.</Muted>
        </Card>
      )}

      {rest.length > 0 && (
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {rest.map((r, i) => (
            <View key={`${r.rank}-${r.display_name}`} style={[s.row, i > 0 && s.rowLine]}>
              <Text style={s.rank}>{r.rank}</Text>
              <Text style={s.person} numberOfLines={1}>
                {r.display_name}
              </Text>
              <Text style={s.score}>{board.unit(r.value)}</Text>
            </View>
          ))}
        </Card>
      )}

      <SectionHead label="Your spot" />
      <FrostCard style={s.mine}>
        <View style={s.mineAvatar}>
          <Text style={s.mineInitial}>{myName[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.mineName}>{myName}</Text>
          <Text style={s.mineSub}>{mine ? `Your best: ${board.unit(mine)}` : 'Log this skill to see your best here'}</Text>
        </View>
        <View style={s.unranked}>
          <Text style={s.unrankedText}>Not ranked</Text>
        </View>
      </FrostCard>
      <Muted style={{ fontSize: 12 }}>
        Only video-verified scores count. Submitting yours with a clip opens with the first monthly challenge.
      </Muted>
      <Text style={s.link} onPress={() => router.push('/compete')}>
        See this month&apos;s challenge →
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  boardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boardTitle: { fontFamily: display, color: colors.text, fontSize: 26, fontWeight: '600' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.border },
  rank: { width: 28, fontFamily: display, color: colors.gold, fontSize: 20, fontWeight: '700' },
  person: { flex: 1, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600' },
  score: { fontFamily: display, color: colors.text, fontSize: 20, fontWeight: '600' },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  mineAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  mineInitial: { fontFamily: display, color: colors.text, fontSize: 22, fontWeight: '700' },
  mineName: { fontFamily: font, color: colors.onFrost, fontSize: 16, fontWeight: '800' },
  mineSub: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '600' },
  unranked: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(11,19,36,0.08)' },
  unrankedText: { fontFamily: font, color: colors.onFrostMuted, fontSize: 11, fontWeight: '800' },
  link: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '700' },
});
