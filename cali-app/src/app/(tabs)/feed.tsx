import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNow } from '@/components/hooks';
import { PressScale, Rise } from '@/components/motion';
import { PostCard } from '@/components/PostCard';
import { Avatar, CommentsSheet, OptionsSheet, ShareSheet } from '@/components/SocialUI';
import { Backdrop, H1, styles as ui } from '@/components/ui';
import { ME, personById, SPACES, type SpaceId } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, display, font, radius, TAB_BAR_SPACE } from '@/theme';

type Target = { kind: 'post'; id: string };

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const { social, toggleLike, like, toggleSave } = useSocial();
  const [space, setSpace] = useState<SpaceId | 'all'>('all');
  const [comments, setComments] = useState<Target | null>(null);
  const [sharing, setSharing] = useState<Target | null>(null);
  const [options, setOptions] = useState<Target | null>(null);

  const posts = useMemo(() => (space === 'all' ? social.posts : social.posts.filter((p) => p.space === space)), [social.posts, space]);
  const active = SPACES.find((x) => x.id === space);
  const me = personById(social, ME);
  const sharingPost = sharing ? social.posts.find((x) => x.id === sharing.id) : undefined;
  const optionsPost = options ? social.posts.find((x) => x.id === options.id) : undefined;

  const header = (
    <View style={{ gap: 18, marginBottom: 6 }}>
      <Rise style={s.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>Community</Text>
          <H1 style={{ marginTop: 2 }}>Feed</H1>
        </View>
        <PressScale onPress={() => router.push('/feed/new')} style={s.newBtn} accessibilityLabel="New post">
          <Ionicons name="add" size={22} color={colors.onFrost} />
        </PressScale>
      </Rise>

      <Rise delay={60}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsWrap} contentContainerStyle={s.chips}>
          {[{ id: 'all' as const, label: 'All', color: colors.frost }, ...SPACES].map((c) => {
            const on = space === c.id;
            return (
              <PressScale key={c.id} onPress={() => setSpace(c.id)} style={[s.chip, on && { backgroundColor: c.color, borderColor: c.color }]} accessibilityLabel={`Show ${c.label}`}>
                {c.id !== 'all' && <View style={[s.chipDot, { backgroundColor: on ? colors.onFrost : c.color }]} />}
                <Text style={[s.chipText, on && { color: colors.onFrost }]}>{c.label}</Text>
              </PressScale>
            );
          })}
        </ScrollView>
      </Rise>

      {active && (
        <View style={[s.spaceBanner, { borderColor: `${active.color}55` }]}>
          <View style={[s.spaceIcon, { backgroundColor: active.color }]}>
            <Text style={s.spaceIconText}>{active.label[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.spaceName}>c/{active.label.toLowerCase().replace(' ', '')}</Text>
            <Text style={s.spaceBlurb}>
              {active.blurb} · {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </Text>
          </View>
        </View>
      )}

      <Rise delay={110}>
        <PressScale onPress={() => router.push({ pathname: '/feed/new', params: space === 'all' ? {} : { space } })} scaleTo={0.98} style={s.composer} accessibilityLabel="Share something">
          <Avatar person={me} size={34} />
          <Text style={s.composerText}>Share a win, a question, a form check…</Text>
          <Ionicons name="image-outline" size={20} color={colors.muted} />
        </PressScale>
      </Rise>
    </View>
  );

  return (
    <Backdrop>
      <FlatList
        style={ui.fill}
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: TAB_BAR_SPACE + insets.bottom, gap: 16 }}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const t: Target = { kind: 'post', id: item.id };
          return (
            <Rise delay={Math.min(index, 4) * 60 + 140}>
              <PostCard
                post={item}
                social={social}
                now={now}
                onLike={() => toggleLike(t)}
                onDoubleLike={() => like(t)}
                onComments={() => setComments(t)}
                onShare={() => setSharing(t)}
                onSave={() => toggleSave(t)}
                onMore={() => setOptions(t)}
              />
            </Rise>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="sparkles-outline" size={28} color={colors.muted} />
            <Text style={s.emptyTitle}>Quiet in here</Text>
            <Text style={s.emptyText}>Be the first to post in {active?.label ?? 'the feed'}.</Text>
          </View>
        }
      />
      <CommentsSheet target={comments} onClose={() => setComments(null)} />
      <ShareSheet key={sharing?.id ?? 'none'} target={sharing} caption={sharingPost?.text ?? ''} onClose={() => setSharing(null)} />
      <OptionsSheet key={options?.id ?? 'none-o'} target={options} mine={optionsPost?.authorId === ME} onClose={() => setOptions(null)} />
    </Backdrop>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 6 },
  kicker: { fontFamily: font, color: '#F2A7C3', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  newBtn: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost, marginBottom: 4 },
  chipsWrap: { marginHorizontal: -16 },
  chips: { gap: 8, paddingHorizontal: 22 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  spaceBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1 },
  spaceIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  spaceIconText: { fontFamily: display, color: colors.onFrost, fontSize: 22, fontWeight: '700' },
  spaceName: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '800' },
  spaceBlurb: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  composerText: { flex: 1, fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 50 },
  emptyTitle: { fontFamily: display, color: colors.text, fontSize: 24, fontWeight: '700' },
  emptyText: { fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '600' },
});
