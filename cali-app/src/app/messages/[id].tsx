import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from '@/components/motion';
import { imageSource } from '@/components/socialMedia';
import { Avatar } from '@/components/SocialUI';
import { Backdrop, H1, Muted } from '@/components/ui';
import { useT } from '@/i18n';
import * as haptics from '@/lib/haptics';
import { personById, type Message, type SocialState } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, display, font, radius } from '@/theme';

function SharedCard({ shared, social, fromMe }: { shared: NonNullable<Message['shared']>; social: SocialState; fromMe: boolean }) {
  const { t } = useT();
  if (shared.kind === 'short') {
    const sh = social.shorts.find((x) => x.id === shared.id);
    if (!sh) return <Text style={s.gone}>{t('msg.shortGone')}</Text>;
    const author = personById(social, sh.authorId);
    return (
      <Pressable onPress={() => router.navigate({ pathname: '/shorts', params: { id: sh.id } })} style={[s.shared, fromMe && s.sharedMine]} accessibilityLabel={t('msg.openShort')}>
        <View style={s.sharedShort}>
          {imageSource(sh.poster) && <Image source={imageSource(sh.poster)} style={StyleSheet.absoluteFill} resizeMode="cover" />}
          <View style={s.sharedPlay}>
            <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
          </View>
        </View>
        <Text style={s.sharedHandle}>@{author?.handle}</Text>
        <Text style={s.sharedText} numberOfLines={2}>
          {sh.caption}
        </Text>
      </Pressable>
    );
  }
  const po = social.posts.find((x) => x.id === shared.id);
  if (!po) return <Text style={s.gone}>{t('feed.unavailable')}</Text>;
  const author = personById(social, po.authorId);
  const img = imageSource(po.image);
  return (
    <Pressable onPress={() => router.push({ pathname: '/feed/[id]', params: { id: po.id } })} style={[s.shared, fromMe && s.sharedMine]} accessibilityLabel={t('msg.openPost')}>
      {img && <Image source={img} style={s.sharedImg} resizeMode="cover" />}
      <Text style={s.sharedHandle}>@{author?.handle}</Text>
      <Text style={s.sharedText} numberOfLines={3}>
        {po.text}
      </Text>
    </Pressable>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { social, send, markRead } = useSocial();
  const { t } = useT();
  const [text, setText] = useState('');
  const scroller = useRef<ScrollViewInstance>(null);
  const conv = social.conversations.find((c) => c.id === id);
  const who = conv ? personById(social, conv.withId) : undefined;
  const count = conv?.messages.length ?? 0;

  useEffect(() => {
    if (conv?.unread) markRead(conv.id);
  }, [conv?.id, conv?.unread, markRead]);
  useEffect(() => {
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: count > 0 }), 60);
    return () => clearTimeout(t);
  }, [count]);

  if (!conv || !who) {
    return (
      <Backdrop>
        <View style={{ padding: 22, paddingTop: insets.top + 70, gap: 8 }}>
          <H1>{t('msg.chatGone')}</H1>
          <Muted>{t('msg.chatGoneText')}</Muted>
        </View>
      </Backdrop>
    );
  }

  const submit = () => {
    if (!text.trim()) return;
    haptics.tap();
    send(conv.id, { text });
    setText('');
  };

  return (
    <Backdrop>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <PressScale onPress={() => router.back()} style={s.back} accessibilityLabel={t('common.back')}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressScale>
        <Avatar person={who} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title}>{who.name}</Text>
          <Text style={s.sub}>@{who.handle}</Text>
        </View>
        <Ionicons name="call-outline" size={21} color={colors.muted} />
        <Ionicons name="videocam-outline" size={23} color={colors.muted} style={{ marginLeft: 14 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroller} contentContainerStyle={s.thread} keyboardShouldPersistTaps="handled">
          <View style={s.intro}>
            <Avatar person={who} size={74} />
            <Text style={s.introName}>{who.name}</Text>
            <Text style={s.introHandle}>@{who.handle}</Text>
            {who.bio && <Text style={s.introBio}>{who.bio}</Text>}
          </View>
          {conv.messages.map((m, i) => {
            const prev = conv.messages[i - 1];
            const grouped = prev && prev.fromMe === m.fromMe;
            return (
              <View key={m.id} style={[s.msgRow, m.fromMe ? s.mine : s.theirs, !grouped && { marginTop: 10 }]}>
                {m.shared && <SharedCard shared={m.shared} social={social} fromMe={m.fromMe} />}
                {m.text && (
                  <View style={[s.bubble, m.fromMe ? s.bubbleMine : s.bubbleTheirs]}>
                    <Text style={[s.bubbleText, m.fromMe && { color: colors.onFrost }]}>{m.text}</Text>
                  </View>
                )}
              </View>
            );
          })}
          {conv.messages.length > 0 && conv.messages.at(-1)?.fromMe && <Text style={s.seen}>{t('social.sent')}</Text>}
        </ScrollView>

        <View style={[s.inputRow, { paddingBottom: insets.bottom + 10 }]}>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder={t('msg.placeholder')}
              placeholderTextColor={colors.faint}
              onSubmitEditing={submit}
              returnKeyType="send"
              maxLength={1000}
            />
          </View>
          <PressScale onPress={submit} disabled={!text.trim()} style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]} accessibilityLabel={t('msg.send')}>
            <Ionicons name="arrow-up" size={19} color={colors.onFrost} />
          </PressScale>
        </View>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(7,11,22,0.92)' },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },
  thread: { padding: 14, paddingBottom: 20, gap: 3 },
  intro: { alignItems: 'center', gap: 4, paddingVertical: 24 },
  introName: { fontFamily: display, color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 8 },
  introHandle: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600' },
  introBio: { fontFamily: font, color: colors.faint, fontSize: 13, fontWeight: '600', marginTop: 4 },
  msgRow: { maxWidth: '78%', gap: 4 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20 },
  bubbleMine: { backgroundColor: colors.frost, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.cardRaised, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: font, color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  shared: { width: 200, padding: 8, gap: 4, borderRadius: radius.md, backgroundColor: colors.cardRaised },
  sharedMine: { backgroundColor: 'rgba(217,217,217,0.16)' },
  sharedShort: { width: '100%', aspectRatio: 9 / 13, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  sharedPlay: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  sharedImg: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12 },
  sharedHandle: { fontFamily: font, color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 2 },
  sharedText: { fontFamily: font, color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  gone: { fontFamily: font, color: colors.faint, fontSize: 13, fontStyle: 'italic' },
  seen: { alignSelf: 'flex-end', fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '600', marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(7,11,22,0.96)' },
  inputWrap: { flex: 1, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  input: { outlineWidth: 0, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 11, paddingHorizontal: 16 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },
});
