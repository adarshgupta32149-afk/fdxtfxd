import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from '@/components/motion';
import * as haptics from '@/lib/haptics';
import { useT } from '@/i18n';
import { useAgo } from '@/i18n/useAgo';
import { personById, shortCount, type Person } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, display, font, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Target = { kind: 'short' | 'post'; id: string };

/** Round avatar with the person's initial on their colour. */
export function Avatar({ person, size = 36, ring }: { person?: Person; size?: number; ring?: boolean }) {
  return (
    <View
      style={[
        s.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: person?.color ?? colors.cardRaised },
        ring && { borderWidth: 2, borderColor: colors.bg },
      ]}
    >
      <Text style={[s.avatarText, { fontSize: size * 0.46 }]}>{(person?.name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

/** Bottom sheet frame shared by comments, share and options. */
function Sheet({ visible, onClose, title, children, tall }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; tall?: boolean }) {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel={t('common.close')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.sheet, tall && { height: '72%' }, { paddingBottom: insets.bottom + 10 }]}>
        <View style={s.grabber} />
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={t('social.closeSheet')}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>
        {children}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function CommentsSheet({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const { social, comment, likeComment } = useSocial();
  const { t } = useT();
  const ago = useAgo();
  const [text, setText] = useState('');
  const [now] = useState(() => new Date());
  const item = target ? (target.kind === 'short' ? social.shorts.find((x) => x.id === target.id) : social.posts.find((x) => x.id === target.id)) : undefined;
  const list = item?.comments ?? [];

  const send = () => {
    if (!target || !text.trim()) return;
    haptics.tap();
    comment(target, text);
    setText('');
  };

  return (
    <Sheet visible={!!target} onClose={onClose} title={t('social.comments', { count: list.length })} tall>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 12, gap: 18 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.faint} />
            <Text style={s.emptyText}>{t('social.noComments')}</Text>
          </View>
        }
        renderItem={({ item: c }) => {
          const who = personById(social, c.authorId);
          return (
            <View style={s.comment}>
              <Avatar person={who} size={32} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.commentHead}>
                  {who?.handle ?? t('social.someone')} <Text style={s.commentTime}>· {ago(c.createdAt, now)}</Text>
                </Text>
                <Text style={s.commentText}>{c.text}</Text>
              </View>
              <Pressable onPress={() => target && likeComment(target, c.id)} hitSlop={8} style={s.commentLike} accessibilityLabel={c.liked ? t('social.unlike') : t('social.like')}>
                <Ionicons name={c.liked ? 'heart' : 'heart-outline'} size={15} color={c.liked ? colors.heart : colors.faint} />
                {c.likes > 0 && <Text style={s.commentLikes}>{shortCount(c.likes)}</Text>}
              </Pressable>
            </View>
          );
        }}
      />
      <View style={s.inputRow}>
        <Avatar person={personById(social, 'me')} size={32} />
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder={t('social.addComment')}
          placeholderTextColor={colors.faint}
          onSubmitEditing={send}
          returnKeyType="send"
          maxLength={500}
        />
        <PressScale onPress={send} disabled={!text.trim()} style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]} accessibilityLabel={t('social.postComment')}>
          <Ionicons name="arrow-up" size={18} color={colors.onFrost} />
        </PressScale>
      </View>
    </Sheet>
  );
}

/** Key it by the target so each post starts with nothing sent. */
export function ShareSheet({ target, caption, onClose }: { target: Target | null; caption: string; onClose: () => void }) {
  const { social, share, send } = useSocial();
  const { t } = useT();
  const [sentTo, setSentTo] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const people = social.conversations.map((c) => ({ conv: c, who: personById(social, c.withId) })).filter((x) => x.who);

  const sendTo = (conversationId: string, name: string) => {
    if (!target || sentTo.includes(conversationId)) return;
    haptics.success();
    send(conversationId, { shared: target });
    share(target);
    setSentTo((x) => [...x, conversationId]);
    setNote(t('social.sentTo', { name }));
  };

  const outside = async () => {
    if (!target) return;
    try {
      await Share.share({ message: `${caption}\n\n${t('social.seenOnCali')}` });
      share(target);
      setNote(t('social.shared'));
    } catch {
      setNote(t('social.shareAppOnly'));
    }
  };

  return (
    <Sheet visible={!!target} onClose={onClose} title={t('social.share')}>
      <Text style={s.shareLabel}>{t('social.sendInMessages')}</Text>
      <FlatList
        horizontal
        data={people}
        keyExtractor={(x) => x.conv.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingBottom: 6 }}
        renderItem={({ item: { conv, who } }) => {
          const done = sentTo.includes(conv.id);
          return (
            <Pressable onPress={() => sendTo(conv.id, who!.name)} style={s.sharePerson} accessibilityLabel={t('social.sendTo', { name: who!.name })}>
              <View>
                <Avatar person={who} size={54} />
                {done && (
                  <View style={s.sentBadge}>
                    <Ionicons name="checkmark" size={12} color={colors.onFrost} />
                  </View>
                )}
              </View>
              <Text style={s.sharePersonName} numberOfLines={1}>
                {done ? t('social.sent') : who!.name}
              </Text>
            </Pressable>
          );
        }}
      />
      <View style={s.shareActions}>
        <ShareAction icon="share-outline" label={t('social.shareOutside')} onPress={outside} />
      </View>
      {note && (
        <View style={s.toast}>
          <Ionicons name="checkmark-circle" size={16} color={colors.glow} />
          <Text style={s.toastText}>{note}</Text>
        </View>
      )}
    </Sheet>
  );
}

function ShareAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} style={s.shareAction} accessibilityLabel={label}>
      <View style={s.shareActionIcon}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <Text style={s.shareActionText}>{label}</Text>
    </PressScale>
  );
}

/** Report anything; delete your own. Key it by the target so each post starts fresh. */
export function OptionsSheet({ target, mine, onClose }: { target: Target | null; mine: boolean; onClose: () => void }) {
  const { remove } = useSocial();
  const { t } = useT();
  const [reported, setReported] = useState(false);
  return (
    <Sheet visible={!!target} onClose={onClose} title={mine ? t('social.yourPost') : t('social.options')}>
      <View style={{ paddingHorizontal: 18, gap: 8 }}>
        {mine ? (
          <OptionRow
            icon="trash-outline"
            label={t('common.delete')}
            danger
            onPress={() => {
              if (!target) return;
              haptics.warning();
              remove(target);
              onClose();
            }}
          />
        ) : reported ? (
          <View style={s.toast}>
            <Ionicons name="shield-checkmark" size={16} color={colors.glow} />
            <Text style={s.toastText}>{t('social.reportThanks')}</Text>
          </View>
        ) : (
          <>
            <OptionRow icon="flag-outline" label={t('social.report')} danger onPress={() => setReported(true)} />
            <OptionRow icon="eye-off-outline" label={t('social.notInterested')} onPress={onClose} />
          </>
        )}
      </View>
    </Sheet>
  );
}

function OptionRow({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <PressScale onPress={onPress} style={s.option} accessibilityLabel={label}>
      <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.text} />
      <Text style={[s.optionText, danger && { color: colors.danger }]}>{label}</Text>
    </PressScale>
  );
}

const s = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: display, color: colors.onFrost, fontWeight: '700' },

  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,4,10,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: '#0E1528',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(228,228,230,0.25)', marginBottom: 6 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  sheetTitle: { fontFamily: display, color: colors.text, fontSize: 22, fontWeight: '700' },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '600' },
  comment: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  commentHead: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  commentTime: { color: colors.faint, fontWeight: '600' },
  commentText: { fontFamily: font, color: '#CDD1DB', fontSize: 14, lineHeight: 20, fontWeight: '500', marginTop: 2 },
  commentLike: { alignItems: 'center', gap: 2, paddingTop: 2, minWidth: 24 },
  commentLikes: { fontFamily: font, color: colors.faint, fontSize: 10, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  input: { outlineWidth: 0, flex: 1, minWidth: 0, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },

  shareLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 18, marginBottom: 12 },
  sharePerson: { alignItems: 'center', gap: 6, width: 62 },
  sharePersonName: { fontFamily: font, color: colors.text, fontSize: 12, fontWeight: '700' },
  sentBadge: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glow, borderWidth: 2, borderColor: '#0E1528' },
  shareActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 18 },
  shareAction: { alignItems: 'center', gap: 6, width: 96 },
  shareActionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  shareActionText: { fontFamily: font, color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 18, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.glowSoft },
  toastText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '700' },

  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.card },
  optionText: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '700' },
});
