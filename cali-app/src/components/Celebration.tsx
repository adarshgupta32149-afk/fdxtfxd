import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/components/motion';
import { colors } from '@/theme';

const COUNT = 28;
const PALETTE = [colors.frostHi, colors.ember, colors.gold, colors.live, colors.frost];

// Deterministic "random" so renders stay pure and every burst looks the same.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const PIECES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + rand(i, 1) * 0.4;
  const dist = 90 + rand(i, 2) * 120;
  return {
    dx: Math.cos(angle) * dist,
    // Pieces fly out, then gravity pulls them down a little.
    dy: Math.sin(angle) * dist * 0.75 + 60,
    spin: (rand(i, 3) - 0.5) * 720,
    color: PALETTE[i % PALETTE.length],
    w: 6 + Math.round(rand(i, 4) * 6),
    h: 10 + Math.round(rand(i, 5) * 8),
    round: rand(i, 6) > 0.6,
    delay: Math.round(rand(i, 7) * 120),
  };
});

/** A one-off burst of confetti from the centre of its parent. Skipped when the user asked for reduced motion. */
export function ConfettiBurst({ play = true }: { play?: boolean }) {
  const t = useState(() => PIECES.map(() => new Animated.Value(0)))[0];
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!play || reduced) return;
    const anim = Animated.parallel(
      t.map((v, i) => Animated.timing(v, { toValue: 1, duration: 1500, delay: PIECES[i].delay, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
    );
    anim.start();
    return () => anim.stop();
  }, [play, reduced, t]);

  if (reduced) return null;
  return (
    <View pointerEvents="none" style={s.origin}>
      {PIECES.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.round ? p.w : p.w,
            height: p.round ? p.w : p.h,
            borderRadius: p.round ? p.w : 2,
            backgroundColor: p.color,
            opacity: t[i].interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: t[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: t[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, p.dy - 50, p.dy] }) },
              { rotate: t[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              { scale: t[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1, 0.8] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  origin: { position: 'absolute', left: '50%', top: '40%', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
});
