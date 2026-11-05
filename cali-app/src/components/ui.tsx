import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Animated,
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

import { colors, display, font, frostGradient, radius, space, TAB_BAR_SPACE } from '@/theme';
import { PressScale, Sheen, useAnimatedProgress } from './motion';

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
  headerInset = false,
  tabBar = false,
  overlay,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Floats above the scrolling content, e.g. a rest timer or a fixed header. */
  overlay?: ReactNode;
  /** Add the status-bar height on screens without a header. */
  topInset?: boolean;
  /** Clear a transparent header (back button) as well as the status bar. */
  headerInset?: boolean;
  /** Leave room at the bottom for the floating tab bar. */
  tabBar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Backdrop>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.screenContent,
          topInset && { paddingTop: insets.top + space.lg },
          headerInset && { paddingTop: insets.top + 60 },
          tabBar && { paddingBottom: TAB_BAR_SPACE + insets.bottom },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {/* Content scrolls under the transparent header; a soft fade keeps the back button readable. */}
      {headerInset && (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(7,11,22,0.96)', 'rgba(7,11,22,0.75)', 'rgba(7,11,22,0)']}
          locations={[0, 0.6, 1]}
          style={[styles.headerFade, { height: insets.top + 72 }]}
        />
      )}
      {overlay}
    </Backdrop>
  );
}

/** Translucent frosted panel. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Solid frosted matte-white panel for the one thing that matters on a screen, with an optional light sweep. */
export function FrostCard({ children, style, sheen = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; sheen?: boolean }) {
  return (
    <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.frost, style]}>
      {sheen && <Sheen />}
      {children}
    </LinearGradient>
  );
}

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

/** Big condensed display title. */
export const H1 = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.h1, style]} numberOfLines={numberOfLines} accessibilityRole="header">
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
/** Condensed numerals for stats, scores and timers. */
export const Num = ({ children, style }: TextProps) => <Text style={[styles.num, style]}>{children}</Text>;

type ButtonVariant = 'primary' | 'navy' | 'glass' | 'danger' | 'ember';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  compact,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Fits its text instead of filling the width. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
}) {
  const textColor = { primary: colors.onFrost, navy: colors.text, glass: colors.text, danger: colors.danger, ember: '#2A1408' }[variant];
  const inner = (
    <View style={styles.buttonRow}>
      {icon}
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </View>
  );
  return (
    <PressScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      haptic="press"
      accessibilityLabel={label}
      style={[compact && { alignSelf: 'flex-start' }, { opacity: disabled ? 0.4 : 1 }, style]}
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
            variant === 'ember' && { backgroundColor: colors.ember },
          ]}
        >
          {inner}
        </View>
      )}
    </PressScale>
  );
}

/** A thin progress bar that fills in with an ease-out when it appears or changes. */
export function ProgressBar({ value, delay = 450 }: { value: number; delay?: number }) {
  const v = useAnimatedProgress(Math.max(0, Math.min(1, value)), delay);
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={{ height: '100%', width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}>
        <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFill} />
      </Animated.View>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityLabel={label}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </PressScale>
  );
}

/** A small rounded tag, e.g. "Free trial · 58 days left". */
export function Pill({ label, dotColor = colors.frost, onPress, dot }: { label: string; dotColor?: string; onPress?: () => void; dot?: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.pill}>
      {dot ?? <View style={[styles.dot, { backgroundColor: dotColor }]} />}
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

/** Section heading row: label on the left, optional action on the right. */
export function SectionHead({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.eyebrow}>{label}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  // Transparent on purpose: scroll views sit on the Backdrop, and a fill colour here would hide the glow.
  fill: { flex: 1 },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  backdrop: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingHorizontal: 22, paddingTop: space.lg, paddingBottom: space.xxl * 2, gap: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 18, gap: space.md, borderWidth: 1, borderColor: colors.border },
  frost: { borderRadius: radius.lg, padding: 22, gap: space.lg, overflow: 'hidden' },
  h1: { fontFamily: display, color: colors.text, fontSize: 42, lineHeight: 44, fontWeight: '600', letterSpacing: -0.2 },
  h2: { fontFamily: font, color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontFamily: font, color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { fontFamily: font, color: colors.muted, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: font, color: colors.muted, fontSize: 11.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  num: { fontFamily: display, color: colors.text, fontSize: 34, lineHeight: 36, fontWeight: '600' },
  button: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glassButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { fontFamily: font, fontSize: 15, fontWeight: '700' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(228,228,230,0.10)', overflow: 'hidden' },
  progressFill: { flex: 1, borderRadius: 3 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.frost, borderColor: colors.frost },
  chipText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.onFrost, fontWeight: '700' },
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
  pillText: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600' },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, gap: 2 },
  statValue: { fontFamily: display, color: colors.text, fontSize: 34, lineHeight: 36, fontWeight: '600' },
  statLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionAction: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '700' },
});
