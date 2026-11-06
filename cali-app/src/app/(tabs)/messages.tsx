import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNow } from '@/components/hooks';
import { PressScale, Rise } from '@/components/motion';
import { Avatar } from '@/components/SocialUI';
import { Backdrop, H1, styles as ui } from '@/components/ui';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { useAgo } from '@/i18n/useAgo';
import { ME, personById, totalUnread, type Message } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, font, radius, TAB_BAR_SPACE } from '@/theme';

function preview(m: Message | undefined, t: (k: Key, v?: Record<string, string | number>) => string): string {
  if (!m) return t('msg.sayHi');
  const body = m.shared ? (m.shared.kind === 'short' ? t('msg.sentShort') : t('msg.sentPost')) : (m.text ?? '');
  return m.fromMe ? t('msg.you', { text: body }) : body;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const { social, chatWith } = useSocial();
  const { t } = useT();
  const ago = useAgo();
  const [query, setQuery] = useState('');
  const unread = totalUnread(social);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return social.conversations
      .map((c) => ({ c, who: personById(social, c.withId) }))
      .filter((x) => x.who && (!q || x.who.name.toLowerCase().includes(q) || x.who.handle.includes(q)));
  }, [social, query]);

  const people = social.people.filter((p) => p.id !== ME);
  const open = (personId: string) => {
    const id = chatWith(personId);
    router.push({ pathname: '/messages/[id]', params: { id } });
  };

  return (
    <Backdrop>
      <FlatList
        style={ui.fill}
        data={rows}
        keyExtractor={(x) => x.c.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: TAB_BAR_SPACE + insets.bottom, gap: 4 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 10 }}>
            <Rise style={{ paddingHorizontal: 6 }}>
              <Text style={s.kicker}>{unread ? t('msg.unread', { count: unread }) : t('msg.caughtUp')}</Text>
              <H1 style={{ marginTop: 2 }}>{t('tabs.messages')}</H1>
            </Rise>
            <Rise delay={50} style={s.search}>
              <Ionicons name="search" size={16} color={colors.faint} />
              <TextInput style={s.searchInput} value={query} onChangeText={setQuery} placeholder={t('msg.search')} placeholderTextColor={colors.faint} />
            </Rise>
            <Rise delay={90}>
              <Text style={s.label}>{t('msg.crew')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 14, paddingHorizontal: 22, paddingTop: 10 }}>
                {people.map((p) => (
                  <Pressable key={p.id} onPress={() => open(p.id)} style={s.person} accessibilityLabel={t('msg.messageTo', { name: p.name })}>
                    <View>
                      <Avatar person={p} size={58} />
                      <View style={s.online} />
                    </View>
                    <Text style={s.personName} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Rise>
            <Text style={s.label}>{t('msg.chats')}</Text>
          </View>
        }
        renderItem={({ item: { c, who }, index }) => {
          const last = c.messages.at(-1);
          return (
            <Rise delay={120 + Math.min(index, 6) * 40}>
              <PressScale onPress={() => router.push({ pathname: '/messages/[id]', params: { id: c.id } })} scaleTo={0.98} style={s.row} accessibilityLabel={t('msg.chatWith', { name: who!.name })}>
                <Avatar person={who} size={50} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={[s.name, c.unread > 0 && { color: colors.text }]}>{who!.name}</Text>
                  <Text style={[s.preview, c.unread > 0 && s.previewUnread]} numberOfLines={1}>
                    {preview(last, t)}
                    {last ? `  ·  ${ago(last.createdAt, now)}` : ''}
                  </Text>
                </View>
                {c.unread > 0 ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{c.unread}</Text>
                  </View>
                ) : (
                  <Ionicons name="camera-outline" size={20} color={colors.faint} />
                )}
              </PressScale>
            </Rise>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>{t('msg.noMatch', { query })}</Text>}
        ListFooterComponent={<Text style={s.footer}>{t('msg.footer')}</Text>}
      />
    </Backdrop>
  );
}

const s = StyleSheet.create({
  kicker: { fontFamily: font, color: colors.glow, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  searchInput: { outlineWidth: 0, flex: 1, minWidth: 0, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 12 },
  label: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 6 },
  person: { alignItems: 'center', gap: 6, width: 64 },
  online: { position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.live, borderWidth: 2.5, borderColor: colors.bg },
  personName: { fontFamily: font, color: colors.text, fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.md },
  name: { fontFamily: font, color: '#C9CDD8', fontSize: 15, fontWeight: '800' },
  preview: { fontFamily: font, color: colors.faint, fontSize: 13, fontWeight: '600' },
  previewUnread: { color: colors.text, fontWeight: '800' },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glow },
  badgeText: { fontFamily: font, color: colors.onFrost, fontSize: 12, fontWeight: '800' },
  empty: { fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 30 },
  footer: { fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 18 },
});
