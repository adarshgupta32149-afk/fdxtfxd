import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import * as haptics from '@/lib/haptics';

const native = true; // transforms and opacity run on the native thread; web falls back automatically

/** True when the user asked their phone for reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Fades and lifts its children in, once, after `delay` ms. Use small staggered delays down a screen. */
export function Rise({ children, delay = 0, distance = 14, style }: { children: ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle> }) {
  const progress = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const anim = Animated.timing(progress, { toValue: 1, duration: 620, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native });
    anim.start();
    return () => anim.stop();
  }, [progress, delay]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A pressable that gives under the finger (springy scale) with a light haptic tick. */
export function PressScale({
  children,
  onPress,
  style,
  containerStyle,
  scaleTo = 0.96,
  haptic = 'tap',
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Style for the outer touch area, e.g. `{ flex: 1 }` so the tile fills its cell. */
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'tap' | 'press' | 'none';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'none';
}) {
  const scale = useState(() => new Animated.Value(1))[0];
  const to = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: native, speed: 40, bounciness: value === 1 ? 8 : 0 }).start();
  return (
    <Pressable
      accessibilityRole={accessibilityRole === 'none' ? undefined : accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={containerStyle}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={() => {
        if (haptic === 'tap') haptics.tap();
        else if (haptic === 'press') haptics.press();
        onPress?.();
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Counts a number up from 0 to `target` with an ease-out, after `delay` ms. */
export function useCountUp(target: number, { delay = 400, duration = 1000 } = {}): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const step = (t: number) => {
        start ??= t;
        const p = Math.min(1, (t - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, delay, duration]);
  return value;
}

/** A slow light sweep across a frosted surface. Place inside a container with overflow hidden. */
export function Sheen({ width = 340, every = 5200, delay = 1400 }: { width?: number; every?: number; delay?: number }) {
  const x = useState(() => new Animated.Value(0))[0];
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.delay(every - 1500),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: native }),
      ]),
    );
    const start = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [x, every, delay, reduced]);
  const band = width * 0.45;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { width: band, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-band * 1.4, width * 1.3] }) }] }]}
    >
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/** A pulsing dot for "live" states. */
export function LiveDot({ color, size = 7 }: { color: string; size?: number }) {
  const pulse = useState(() => new Animated.Value(0))[0];
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);
  return (
    <Animated.View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
        }}
      />
      <Animated.View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </Animated.View>
  );
}

/** Animates a 0..1 value whenever `to` changes; handy for progress bars. */
export function useAnimatedProgress(to: number, delay = 500): Animated.Value {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: to, duration: 1200, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [v, to, delay]);
  return v;
}
