import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { Board, BoardRow } from '@/lib/boards';
import { colors, display, font, frostGradient } from '@/theme';

// Visual order on the podium is 2nd, 1st, 3rd.
const SLOTS = [
  { place: 2, height: 108 },
  { place: 1, height: 148 },
  { place: 3, height: 84 },
];

/**
 * The top three as a podium. Blocks rise into place one after another whenever the board changes.
 * Empty places stay visible as "open" so a quiet board still invites the first entry.
 */
export function Podium({ rows, board }: { rows: BoardRow[]; board: Board }) {
  const rise = useState(() => SLOTS.map(() => new Animated.Value(0)))[0];

  useEffect(() => {
    rise.forEach((v) => v.setValue(0));
    Animated.stagger(
      110,
      [1, 0, 2].map((i) => Animated.spring(rise[i], { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 7 })),
    ).start();
  }, [board.id, rows.length, rise]);

  return (
    <View style={s.row}>
      {SLOTS.map((slot, i) => {
        const row = rows.find((r) => r.rank === slot.place) ?? rows[slot.place - 1];
        const first = slot.place === 1;
        return (
          <Animated.View
            key={slot.place}
            style={[
              s.col,
              {
                opacity: rise[i],
                transform: [{ translateY: rise[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}
          >
            <View style={[s.avatar, first && s.avatarFirst]}>
              <Text style={[s.initial, first && { color: colors.onFrost }]}>{row ? row.display_name[0]?.toUpperCase() : '?'}</Text>
            </View>
            <Text style={s.name} numberOfLines={1}>
              {row ? row.display_name : 'Open'}
            </Text>
            <Text style={s.value}>{row ? board.unit(row.value) : '—'}</Text>
            {first ? (
              <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.block, { height: slot.height }]}>
                <Text style={[s.place, { color: colors.onFrost }]}>1</Text>
              </LinearGradient>
            ) : (
              <View style={[s.block, s.glass, { height: slot.height }]}>
                <Text style={s.place}>{slot.place}</Text>
              </View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, marginBottom: 4 },
  avatarFirst: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.frost, borderColor: colors.frost },
  initial: { fontFamily: display, color: colors.text, fontSize: 22, fontWeight: '700' },
  name: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '700', maxWidth: '100%' },
  value: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  block: { width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', paddingTop: 10 },
  glass: { backgroundColor: colors.card, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border },
  place: { fontFamily: display, color: colors.gold, fontSize: 30, fontWeight: '700' },
});
