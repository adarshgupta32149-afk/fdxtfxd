import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, frostGradient, radius, space } from '@/theme';

const backdrop = require('../../assets/images/backdrop.jpg');

/** The fixed navy glow every screen sits on. It never moves, so glass panels need no live blur. */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <ImageBackground source={backdrop} resizeMode="cover" style={styles.backdrop}>
      {children}
    </ImageBackground>
  );
}

export function Screen({
  children,
  contentStyle,
  topInset = false,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Add the status-bar height on screens without a header. */
  topInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Backdrop>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.screenContent, topInset && { paddingTop: insets.top + space.xl }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Backdrop>
  );
}

/** Translucent frosted panel. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Solid frosted matte-white panel, for the one thing that matters on a screen. */
export function FrostCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.frost, style]}>
      {children}
    </LinearGradient>
  );
}

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

export const H1 = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.h1, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);
export const H2 = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.h2, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);
export const Body = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.body, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);
export const Muted = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);
/** Small uppercase label that introduces a section. */
export const Eyebrow = ({ children, style }: TextProps) => <Text style={[styles.eyebrow, style]}>{children}</Text>;

type ButtonVariant = 'primary' | 'navy' | 'glass' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Fits its text instead of filling the width. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = { primary: colors.onFrost, navy: colors.text, glass: colors.text, danger: colors.danger }[variant];
  const inner = <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [compact && { alignSelf: 'flex-start' }, { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            variant === 'navy' && { backgroundColor: colors.navy },
            variant === 'glass' && styles.glassButton,
            variant === 'danger' && { backgroundColor: colors.dangerFill, borderWidth: 1, borderColor: 'rgba(242,161,161,0.18)' },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.progressTrack}>
      <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** A small rounded tag, e.g. "Free trial · 58 days left". */
export function Pill({ label, dotColor = colors.frost, onPress }: { label: string; dotColor?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  // Transparent on purpose: scroll views sit on the Backdrop, and a fill colour here would hide the glow.
  fill: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xxl * 2, gap: space.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 18,
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frost: { borderRadius: radius.lg, padding: 22, gap: space.lg, overflow: 'hidden' },
  h1: { fontFamily: font, color: colors.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.9 },
  h2: { fontFamily: font, color: colors.text, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontFamily: font, color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { fontFamily: font, color: colors.muted, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  button: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  glassButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { fontFamily: font, fontSize: 15, fontWeight: '600' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(228,228,230,0.10)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.frost, borderColor: colors.frost },
  chipText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.onFrost, fontWeight: '600' },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '500' },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 2 },
  statValue: { fontFamily: font, color: colors.text, fontSize: 24, fontWeight: '600', letterSpacing: -0.5 },
  statLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '500' },
});
