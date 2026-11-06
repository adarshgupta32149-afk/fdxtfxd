import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import * as haptics from '@/lib/haptics';
import { colors } from '@/theme';

const TILES = [colors.frost, colors.glow, colors.ember, 'rgba(228,228,230,0.35)'];

/**
 * The menu trigger: a 2×2 grid of rounded tiles in the app's colours, like an app launcher.
 * On press the grid twists a quarter turn and the tiles pull together before the menu opens.
 */
export function HubButton({ onPress }: { onPress: () => void }) {
  const { t: tr } = useT();
  const t = useState(() => new Animated.Value(0))[0];
  const press = () => {
    haptics.tap();
    t.setValue(0);
    Animated.spring(t, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start(() => t.setValue(0));
    onPress();
  };
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const squeeze = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.78, 1] });

  return (
    <Pressable onPress={press} accessibilityRole="button" accessibilityLabel={tr('menu.open')} hitSlop={6} style={s.btn}>
      <Animated.View style={[s.grid, { transform: [{ rotate }, { scale: squeeze }] }]}>
        {TILES.map((c, i) => (
          <View key={i} style={[s.tile, { backgroundColor: c }]} />
        ))}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grid: { width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  tile: { width: 7.5, height: 7.5, borderRadius: 2.5 },
});
