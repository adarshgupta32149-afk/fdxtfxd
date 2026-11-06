import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { PressScale } from '@/components/motion';
import { HeartBurst } from '@/components/ShortItem';
import { imageSource } from '@/components/socialMedia';
import { Avatar } from '@/components/SocialUI';
import * as haptics from '@/lib/haptics';
import { personById, SPACES, timeAgo, type FeedPost, type SocialState } from '@/lib/social';
import { colors, display, font, radius } from '@/theme';

export function SpaceTag({ space }: { space: FeedPost['space'] }) {
  const sp = SPACES.find((x) => x.id === space)!;
  return (
    <View style={[s.space, { backgroundColor: `${sp.color}22` }]}>
      <Text style={[s.spaceText, { color: sp.color }]}>{sp.label}</Text>
    </View>
  );
}

export function PostCard({
  post,
  social,
  now,
  onLike,
  onDoubleLike,
  onComments,
  onShare,
  onSave,
  onMore,
  detail,
}: {
  post: FeedPost;
  social: SocialState;
  now: Date;
  onLike: () => void;
  onDoubleLike: () => void;
  onComments: () => void;
  onShare: () => void;
  onSave: () => void;
  onMore: () => void;
  /** On the post page: show the whole text and skip the comment preview. */
  detail?: boolean;
}) {
  const author = personById(social, post.authorId);
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTap = useRef(0);
  const img = imageSource(post.image);
  const lastComment = post.comments.at(-1);
  const lastCommenter = lastComment ? personById(social, lastComment.authorId) : undefined;
  const open = () => router.push({ pathname: '/feed/[id]', params: { id: post.id } });

  // Double-tap the photo (or the text card) to like it, Instagram style.
  const onBodyPress = (e: GestureResponderEvent) => {
    const t = Date.now();
    if (t - lastTap.current < 280) {
      lastTap.current = 0;
      haptics.press();
      setBurst({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY, key: t });
      onDoubleLike();
    } else {
      lastTap.current = t;
    }
  };

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Avatar person={author} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.headLine}>
            <Text style={s.handle} numberOfLines={1}>
              {author?.handle ?? 'someone'}
            </Text>
            <Text style={s.time}>· {timeAgo(post.createdAt, now)}</Text>
          </View>
          <View style={s.headLine}>
            <SpaceTag space={post.space} />
            {post.sample && <Text style={s.sample}>Sample</Text>}
          </View>
        </View>
        <Pressable onPress={onMore} hitSlop={10} accessibilityLabel="Post options">
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable onPress={onBodyPress} accessibilityLabel="Double tap to like">
        {img ? (
          <View style={[s.media, { aspectRatio: post.aspect ?? 4 / 5 }]}>
            <Image source={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
        ) : (
          <View style={s.textCard}>
            <Text style={s.textBody} numberOfLines={detail ? undefined : 8}>
              {post.text}
            </Text>
          </View>
        )}
        {burst && <HeartBurst key={burst.key} x={burst.x} y={burst.y} onDone={() => setBurst(null)} />}
      </Pressable>

      <View style={s.actions}>
        <PressScale onPress={onLike} scaleTo={0.8} haptic="tap" style={s.action} accessibilityLabel={post.liked ? 'Unlike' : 'Like'}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={25} color={post.liked ? colors.heart : colors.text} />
        </PressScale>
        <PressScale onPress={onComments} scaleTo={0.8} style={s.action} accessibilityLabel="Comment">
          <Ionicons name="chatbubble-outline" size={23} color={colors.text} />
        </PressScale>
        <PressScale onPress={onShare} scaleTo={0.8} style={s.action} accessibilityLabel="Share">
          <Ionicons name="paper-plane-outline" size={23} color={colors.text} />
        </PressScale>
        <View style={{ flex: 1 }} />
        <PressScale onPress={onSave} scaleTo={0.8} haptic="tap" style={s.action} accessibilityLabel={post.saved ? 'Unsave' : 'Save'}>
          <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={23} color={post.saved ? colors.gold : colors.text} />
        </PressScale>
      </View>

      <View style={s.body}>
        <Text style={s.likes}>
          {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
          {post.shares > 0 ? <Text style={s.shares}>  ·  {post.shares} shares</Text> : null}
        </Text>
        {img && (
          <Text style={s.caption} numberOfLines={detail ? undefined : 3}>
            <Text style={s.captionHandle}>{author?.handle} </Text>
            {post.text}
          </Text>
        )}
        {post.credit && <Text style={s.credit}>{post.credit}</Text>}
        {!detail && post.comments.length > 0 && (
          <Pressable onPress={open} accessibilityLabel="View comments">
            <Text style={s.viewAll}>
              View {post.comments.length === 1 ? '1 comment' : `all ${post.comments.length} comments`}
            </Text>
            {lastComment && (
              <Text style={s.preview} numberOfLines={1}>
                <Text style={s.captionHandle}>{lastCommenter?.handle} </Text>
                {lastComment.text}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  headLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handle: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  time: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },
  sample: { fontFamily: font, color: colors.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  space: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6, marginTop: 2 },
  spaceText: { fontFamily: font, fontSize: 10.5, fontWeight: '800' },
  media: { width: '100%', backgroundColor: colors.navyPanel },
  textCard: { marginHorizontal: 12, padding: 18, borderRadius: radius.md, backgroundColor: 'rgba(228,228,230,0.05)', borderWidth: 1, borderColor: colors.border, minHeight: 110, justifyContent: 'center' },
  textBody: { fontFamily: display, color: colors.text, fontSize: 25, lineHeight: 29, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingTop: 8 },
  action: { padding: 6 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  likes: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '800' },
  shares: { color: colors.faint, fontWeight: '600' },
  caption: { fontFamily: font, color: '#CDD1DB', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  captionHandle: { color: colors.text, fontWeight: '800' },
  credit: { fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '600' },
  viewAll: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  preview: { fontFamily: font, color: '#CDD1DB', fontSize: 13, fontWeight: '500', marginTop: 2 },
});
