import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNow } from '@/components/hooks';
import { PressScale } from '@/components/motion';
import { PostCard } from '@/components/PostCard';
import { Avatar, OptionsSheet, ShareSheet } from '@/components/SocialUI';
import { Backdrop, H1, Muted } from '@/components/ui';
import * as haptics from '@/lib/haptics';
import { useT } from '@/i18n';
import { useAgo } from '@/i18n/useAgo';
import { ME, personById, shortCount } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, font } from '@/theme';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const { social, toggleLike, like, toggleSave, comment, likeComment } = useSocial();
  const { t } = useT();
  const ago = useAgo();
  const [text, setText] = useState('');
  const [sharing, setSharing] = useState(false);
  const [options, setOptions] = useState(false);
  const post = social.posts.find((p) => p.id === id);

  if (!post) {
    return (
      <Backdrop>
        <View style={{ padding: 22, paddingTop: insets.top + 70, gap: 8 }}>
          <H1>{t('feed.removed')}</H1>
          <Muted>{t('feed.unavailable')}</Muted>
        </View>
      </Backdrop>
    );
  }
  const tg = { kind: 'post' as const, id: post.id };
  const send = () => {
    if (!text.trim()) return;
    haptics.tap();
    comment(tg, text);
    setText('');
  };

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 60, paddingBottom: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <PostCard
            post={post}
            social={social}
            now={now}
            detail
            onLike={() => toggleLike(tg)}
            onDoubleLike={() => like(tg)}
            onComments={() => {}}
            onShare={() => setSharing(true)}
            onSave={() => toggleSave(tg)}
            onMore={() => setOptions(true)}
          />
          <Text style={s.head}>
            {t('social.comments', { count: post.comments.length })}
          </Text>
          {post.comments.length === 0 && <Muted>{t('feed.noComments')}</Muted>}
          {post.comments.map((c) => {
            const who = personById(social, c.authorId);
            return (
              <View key={c.id} style={s.comment}>
                <Avatar person={who} size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.commentHead}>
                    {who?.handle ?? t('social.someone')} <Text style={s.time}>· {ago(c.createdAt, now)}</Text>
                  </Text>
                  <Text style={s.commentText}>{c.text}</Text>
                </View>
                <Pressable onPress={() => likeComment(tg, c.id)} hitSlop={8} style={s.like} accessibilityLabel={c.liked ? t('social.unlike') : t('social.like')}>
                  <Ionicons name={c.liked ? 'heart' : 'heart-outline'} size={15} color={c.liked ? colors.heart : colors.faint} />
                  {c.likes > 0 && <Text style={s.likeCount}>{shortCount(c.likes)}</Text>}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
        <View style={[s.inputRow, { paddingBottom: insets.bottom + 10 }]}>
          <Avatar person={personById(social, ME)} size={32} />
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder={t('feed.replyTo', { handle: personById(social, post.authorId)?.handle ?? '' })}
            placeholderTextColor={colors.faint}
            onSubmitEditing={send}
            returnKeyType="send"
            maxLength={500}
          />
          <PressScale onPress={send} disabled={!text.trim()} style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]} accessibilityLabel={t('social.postComment')}>
            <Ionicons name="arrow-up" size={18} color={colors.onFrost} />
          </PressScale>
        </View>
      </KeyboardAvoidingView>
      <ShareSheet key={sharing ? 'share' : 'none'} target={sharing ? tg : null} caption={post.text} onClose={() => setSharing(false)} />
      <OptionsSheet
        key={options ? 'opt' : 'none-o'}
        target={options ? tg : null}
        mine={post.authorId === ME}
        onClose={() => {
          setOptions(false);
          if (!social.posts.some((p) => p.id === post.id)) router.back();
        }}
      />
    </Backdrop>
  );
}

const s = StyleSheet.create({
  head: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 },
  comment: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  commentHead: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  time: { color: colors.faint, fontWeight: '600' },
  commentText: { fontFamily: font, color: '#CDD1DB', fontSize: 14, lineHeight: 20, fontWeight: '500', marginTop: 2 },
  like: { alignItems: 'center', gap: 2, paddingTop: 2, minWidth: 24 },
  likeCount: { fontFamily: font, color: colors.faint, fontSize: 10, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(7,11,22,0.96)' },
  input: { outlineWidth: 0, flex: 1, minWidth: 0, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },
});
