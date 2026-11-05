import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, BackHandler, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND } from '@/lib/brand';
import * as haptics from '@/lib/haptics';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, frostGradient, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface MenuContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const MenuContext = createContext<MenuContextValue>({ open: () => {}, close: () => {}, isOpen: false });
export const useMenu = () => useContext(MenuContext);

const ITEMS: { label: string; hint: string; icon: IconName; href: Href }[] = [
  { label: 'History', hint: 'Every session you logged', icon: 'time-outline', href: '/history' },
  { label: 'Skills', hint: 'Your progressions', icon: 'ribbon-outline', href: '/skills' },
  { label: 'Records', hint: 'Personal bests', icon: 'stats-chart-outline', href: '/records' },
  { label: 'Profile', hint: 'You, account and data', icon: 'person-outline', href: '/profile' },
];

/**
 * Wraps the whole app. When the menu opens, the app slides right and shrinks a little behind
 * a dimmed scrim while the menu glides in from the left, with its items arriving one by one.
 */
export function MenuShell({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const progress = useState(() => new Animated.Value(0))[0];
  const { width } = useWindowDimensions();
  const panel = Math.min(300, width * 0.8);

  const animate = useCallback(
    (to: 0 | 1) => {
      Animated.timing(progress, { toValue: to, duration: to ? 420 : 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
        if (to === 0) setMounted(false);
      });
    },
    [progress],
  );

  const open = useCallback(() => {
    haptics.tap();
    setMounted(true);
    setOpen(true);
    animate(1);
  }, [animate]);
  const close = useCallback(() => {
    setOpen(false);
    animate(0);
  }, [animate]);

  // Android back button closes the menu first.
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, close]);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <MenuContext.Provider value={value}>
      <View style={s.root}>
        <Animated.View
          style={[
            s.app,
            // Corner radius can't run on the native animation thread, so it switches with the open state.
            mounted && { borderRadius: 28 },
            {
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, panel * 0.42] }) },
                { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
        {mounted && (
          <>
            <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: progress }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu" />
            </Animated.View>
            <Animated.View
              style={[s.panel, { width: panel, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-panel, 0] }) }] }]}
              accessibilityViewIsModal
            >
              <MenuPanel progress={progress} onNavigate={close} />
            </Animated.View>
          </>
        )}
      </View>
    </MenuContext.Provider>
  );
}

function MenuPanel({ progress, onNavigate }: { progress: Animated.Value; onNavigate: () => void }) {
  const insets = useSafeAreaInsets();
  const { state, access } = useAppState();
  const name = state.profile.displayName.trim();
  return (
    <View style={[s.panelInner, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}>
      <View style={s.brandRow}>
        <Text style={s.brand}>{BRAND.name}</Text>
        <Text style={s.brandSub}>{name ? `Signed in as ${name}` : 'Calisthenics, ranked'}</Text>
      </View>
      <View style={{ gap: 4 }}>
        {ITEMS.map((item, i) => {
          // Each item slides in a little after the one above it.
          const start = 0.25 + i * 0.12;
          const p = progress.interpolate({ inputRange: [0, start, Math.min(1, start + 0.45)], outputRange: [0, 0, 1], extrapolate: 'clamp' });
          return (
            <Animated.View key={item.label} style={{ opacity: p, transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }}>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  onNavigate();
                  router.push(item.href);
                }}
                style={({ pressed }) => [s.item, pressed && { backgroundColor: colors.card }]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={s.itemIcon}>
                  <Ionicons name={item.icon} size={19} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemLabel}>{item.label}</Text>
                  <Text style={s.itemHint}>{item.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.faint} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      <Pressable
        onPress={() => {
          onNavigate();
          router.push('/paywall');
        }}
        style={{ marginTop: 'auto' }}
        accessibilityRole="button"
      >
        <LinearGradient colors={frostGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.pass}>
          <Text style={s.passKicker}>{access.status === 'pro' ? 'Founder' : 'Founder Pass'}</Text>
          <Text style={s.passTitle}>
            {access.status === 'pro' ? 'Pro, unlimited' : access.status === 'expired' ? 'Trial ended' : `${access.daysLeft} days of trial left`}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03060D' },
  app: { flex: 1, overflow: 'hidden', backgroundColor: colors.bg },
  scrim: { backgroundColor: 'rgba(2,4,10,0.55)' },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.drawer, borderRightWidth: 1, borderRightColor: colors.border },
  panelInner: { flex: 1, paddingHorizontal: 16, gap: 18 },
  brandRow: { paddingHorizontal: 8, gap: 2, marginBottom: 6 },
  brand: { fontFamily: display, color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: 0.5 },
  brandSub: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.sm + 2 },
  itemIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  itemLabel: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '700' },
  itemHint: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },
  pass: { borderRadius: radius.md, padding: 16, gap: 2 },
  passKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  passTitle: { fontFamily: display, color: colors.onFrost, fontSize: 24, fontWeight: '600' },
});
