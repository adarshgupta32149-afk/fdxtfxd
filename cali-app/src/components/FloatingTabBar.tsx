import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, useState, type ComponentProps, type Ref } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View, type ViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Key } from '@/i18n/en';
import { useT } from '@/i18n';
import * as haptics from '@/lib/haptics';
import { totalUnread } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, font, frostGradient } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const TABS: {
  name: string;
  href: '/' | '/feed' | '/shorts' | '/messages' | '/learn';
  icon: IconName;
  iconOn: IconName;
  /** The sliding pill takes this gradient when the tab is active. */
  pill: readonly [string, string, ...string[]];
}[] = [
  { name: 'home', href: '/', icon: 'home-outline', iconOn: 'home', pill: frostGradient },
  { name: 'feed', href: '/feed', icon: 'people-outline', iconOn: 'people', pill: ['#F8C9DB', '#F2A7C3', '#DE8AAB'] },
  { name: 'shorts', href: '/shorts', icon: 'play-circle-outline', iconOn: 'play-circle', pill: ['#FFC29E', '#FF9A62', '#F07F45'] },
  { name: 'messages', href: '/messages', icon: 'chatbubbles-outline', iconOn: 'chatbubbles', pill: ['#CFE0FF', '#9EC2FF', '#7FA6EE'] },
  { name: 'learn', href: '/learn', icon: 'book-outline', iconOn: 'book', pill: ['#F1E6C4', '#E3D3A6', '#CDB983'] },
];

const PAD = 6;

/** Which tab the current path belongs to. */
export function tabIndexFor(pathname: string): number {
  const i = TABS.findIndex((t) => t.href !== '/' && pathname.startsWith(t.href));
  return i === -1 ? 0 : i;
}

type TabButtonProps = TabTriggerSlotProps & { tab: (typeof TABS)[number]; badge?: number; ref?: Ref<ViewInstance> };

function TabButton({ tab, badge, isFocused, onPress, ...rest }: TabButtonProps) {
  const { t } = useT();
  const label = t(`tabs.${tab.name}` as Key);
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
      accessibilityLabel={label}
    >
      <View>
        <Ionicons name={isFocused ? tab.iconOn : tab.icon} size={20} color={isFocused ? colors.onFrost : colors.muted} />
        {!!badge && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[s.label, { color: isFocused ? colors.onFrost : colors.muted }]}>{label}</Text>
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
  const unread = totalUnread(useSocial().social);
  const { width: screen } = useWindowDimensions();
  const [barWidth, setBarWidth] = useState(Math.min(400, screen - 24));
  const segment = (barWidth - PAD * 2) / TABS.length;
  const x = useState(() => new Animated.Value(active))[0];

  useEffect(() => {
    Animated.spring(x, { toValue: active, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [active, x]);

  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom: insets.bottom + 18 }]}>
      <View style={[s.bar, { width: Math.min(400, screen - 24) }]} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
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
            <TabButton tab={tab} badge={tab.name === 'messages' ? unread : 0} />
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
  label: { fontFamily: font, fontSize: 10.5, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.heart,
    borderWidth: 1.5,
    borderColor: '#0E1424',
  },
  badgeText: { fontFamily: font, color: '#fff', fontSize: 9, fontWeight: '800' },
});
