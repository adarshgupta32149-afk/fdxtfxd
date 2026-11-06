import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from '@/components/motion';
import { ShortItem } from '@/components/ShortItem';
import { CommentsSheet, OptionsSheet, ShareSheet } from '@/components/SocialUI';
import * as haptics from '@/lib/haptics';
import { ME } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, display, font } from '@/theme';

type Target = { kind: 'short'; id: string };

export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const { social, toggleLike, like, toggleSave } = useSocial();
  const [height, setHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(true);
  // Browsers only autoplay muted video, so Shorts start muted; one tap turns sound on for all.
  const [muted, setMuted] = useState(true);
  const [comments, setComments] = useState<Target | null>(null);
  const [sharing, setSharing] = useState<Target | null>(null);
  const [options, setOptions] = useState<Target | null>(null);
  const list = useRef<FlatList<(typeof social.shorts)[number]>>(null);
  const { id: openId } = useLocalSearchParams<{ id?: string }>();

  // Opened from a shared Short in Messages: jump straight to it. The scroll event then sets the index.
  useEffect(() => {
    if (!openId || !height) return;
    const i = social.shorts.findIndex((x) => x.id === openId);
    if (i >= 0) requestAnimationFrame(() => list.current?.scrollToOffset({ offset: i * height, animated: false }));
  }, [openId, height, social.shorts]);

  // Pause when the user leaves the tab, resume when they come back.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!height) return;
    const i = Math.round(e.nativeEvent.contentOffset.y / height);
    if (i !== index) setIndex(i);
  };

  // Clears the floating tab bar.
  const bottomInset = insets.bottom + 84;
  const sharingShort = sharing ? social.shorts.find((x) => x.id === sharing.id) : undefined;
  const optionsShort = options ? social.shorts.find((x) => x.id === options.id) : undefined;

  return (
    <View style={s.root} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <FlatList
          ref={list}
          data={social.shorts}
          keyExtractor={(x) => x.id}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          renderItem={({ item, index: i }) => {
            const t: Target = { kind: 'short', id: item.id };
            return (
              <ShortItem
                short={item}
                social={social}
                height={height}
                active={focused && i === index}
                muted={muted}
                bottomInset={bottomInset}
                onToggleMute={() => setMuted((m) => !m)}
                onLike={() => {
                  haptics.tap();
                  toggleLike(t);
                }}
                onDoubleLike={() => like(t)}
                onComments={() => setComments(t)}
                onShare={() => setSharing(t)}
                onSave={() => {
                  haptics.tap();
                  toggleSave(t);
                }}
                onMore={() => setOptions(t)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={[s.empty, { height }]}>
              <Ionicons name="videocam-outline" size={34} color={colors.muted} />
              <Text style={s.emptyTitle}>No Shorts yet</Text>
              <Text style={s.emptyText}>Post the first one. Up to 3 minutes.</Text>
            </View>
          }
        />
      )}

      <View style={[s.top, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <Text style={s.title}>Shorts</Text>
        <View style={s.topActions}>
          <PressScale onPress={() => setMuted((m) => !m)} style={s.topBtn} accessibilityLabel={muted ? 'Turn sound on' : 'Mute'}>
            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color="#fff" />
          </PressScale>
          <PressScale onPress={() => router.push('/shorts/new')} style={[s.topBtn, s.postBtn]} accessibilityLabel="Post a Short">
            <Ionicons name="add" size={20} color={colors.onFrost} />
          </PressScale>
        </View>
      </View>

      <CommentsSheet target={comments} onClose={() => setComments(null)} />
      <ShareSheet key={sharing?.id ?? 'none'} target={sharing} caption={sharingShort?.caption ?? ''} onClose={() => setSharing(null)} />
      <OptionsSheet key={options?.id ?? 'none-o'} target={options} mine={optionsShort?.authorId === ME} onClose={() => setOptions(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontFamily: display, color: '#fff', fontSize: 30, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 8 },
  topActions: { flexDirection: 'row', gap: 10 },
  topBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  postBtn: { backgroundColor: colors.frost, borderColor: colors.frost },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontFamily: display, color: colors.text, fontSize: 26, fontWeight: '700' },
  emptyText: { fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '600' },
});
