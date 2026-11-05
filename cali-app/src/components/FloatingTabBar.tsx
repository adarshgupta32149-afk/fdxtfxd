import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, useState, type ComponentProps, type Ref } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View, type ViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as haptics from '@/lib/haptics';
import { colors, font, frostGradient } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const TABS: {
  name: string;
  href: '/' | '/ranking' | '/compete' | '/learn';
  label: string;
  icon: IconName;
  iconOn: IconName;
  /** The sliding pill takes this gradient when the tab is active. */
  pill: readonly [string, string, ...string[]];
}[] = [
  { name: 'home', href: '/', label: 'Home', icon: 'home-outline', iconOn: 'home', pill: frostGradient },
  { name: 'ranking', href: '/ranking', label: 'Ranking', icon: 'podium-outline', iconOn: 'podium', pill: ['#F1E6C4', '#E3D3A6', '#CDB983'] },
  { name: 'compete', href: '/compete', label: 'Compete', icon: 'trophy-outline', iconOn: 'trophy', pill: ['#FFC29E', '#FF9A62', '#F07F45'] },
  { name: 'learn', href: '/learn', label: 'Learn', icon: 'book-outline', iconOn: 'book', pill: ['#B8EDCD', '#8FD3AE', '#6DB890'] },
];

const PAD = 6;

/** Which tab the current path belongs to. */
export function tabIndexFor(pathname: string): number {
  if (pathname.startsWith('/ranking')) return 1;
  if (pathname.startsWith('/compete')) return 2;
  if (pathname.startsWith('/learn')) return 3;
  return 0;
}

type TabButtonProps = TabTriggerSlotProps & { tab: (typeof TABS)[number]; ref?: Ref<ViewInstance> };

function TabButton({ tab, isFocused, onPress, ...rest }: TabButtonProps) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        if (!isFocused) haptics.tap();
        onPress?.(e);
      }}
      style={s.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={tab.label}
    >
      <Ionicons name={isFocused ? tab.iconOn : tab.icon} size={20} color={isFocused ? colors.onFrost : colors.muted} />
      <Text style={[s.label, { color: isFocused ? colors.onFrost : colors.muted }]}>{tab.label}</Text>
    </Pressable>
  );
}

/**
 * A floating glass bar. A frosted pill springs to the active tab; each button is a TabTrigger,
 * so switching tabs keeps every tab's own state.
 */
export function FloatingTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const active = tabIndexFor(pathname);
  const { width: screen } = useWindowDimensions();
  const [barWidth, setBarWidth] = useState(Math.min(360, screen - 36));
  const segment = (barWidth - PAD * 2) / TABS.length;
  const x = useState(() => new Animated.Value(active))[0];

  useEffect(() => {
    Animated.spring(x, { toValue: active, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [active, x]);

  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom: insets.bottom + 18 }]}>
      <View style={[s.bar, { width: Math.min(360, screen - 36) }]} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
        <Animated.View
          style={[
            s.indicator,
            { width: segment, transform: [{ translateX: x.interpolate({ inputRange: [0, TABS.length - 1], outputRange: [0, segment * (TABS.length - 1)] }) }] },
          ]}
        >
          {/* One gradient per tab, cross-faded as the pill slides, so its colour follows the tab. */}
          {TABS.map((tab, i) => (
            <Animated.View
              key={tab.name}
              style={[StyleSheet.absoluteFill, { opacity: x.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' }) }]}
            >
              <LinearGradient colors={tab.pill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.indicatorFill} />
            </Animated.View>
          ))}
        </Animated.View>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} asChild>
            <TabButton tab={tab} />
          </TabTrigger>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    height: 64,
    borderRadius: 22,
    padding: PAD,
    flexDirection: 'row',
    backgroundColor: 'rgba(14,20,36,0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  indicator: { position: 'absolute', top: PAD, bottom: PAD, left: PAD },
  indicatorFill: { flex: 1, borderRadius: 16 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: font, fontSize: 11, fontWeight: '700' },
});
