import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvent } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale, Rise } from '@/components/motion';
import { Backdrop, Button, H1, Muted } from '@/components/ui';
import { useT } from '@/i18n';
import * as haptics from '@/lib/haptics';
import { checkShortDuration, formatDuration, MAX_SHORT_SEC } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, display, font, radius } from '@/theme';

interface Picked {
  uri: string;
  /** From the picker, in milliseconds, when it knows. */
  durationMs: number | null;
}

/** Plays the picked clip and reports its real length once loaded (the web picker often cannot). */
function Preview({ uri, onDuration }: { uri: string; onDuration: (sec: number) => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    if (status === 'readyToPlay' && player.duration > 0) onDuration(player.duration);
  }, [status, player, onDuration]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

export default function NewShortScreen() {
  const insets = useSafeAreaInsets();
  const { postShort } = useSocial();
  const { t } = useT();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [measuredSec, setMeasuredSec] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const durationMs = picked?.durationMs ?? (measuredSec != null ? measuredSec * 1000 : null);
  const check = picked && durationMs != null ? checkShortDuration(durationMs) : null;
  const seconds = durationMs != null ? Math.round(durationMs / 1000) : null;

  const choose = async (from: 'library' | 'camera') => {
    setError(null);
    try {
      if (from === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return setError(t('upload.cameraOff'));
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['videos'], videoMaxDuration: MAX_SHORT_SEC, quality: 1 };
      const res = from === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets[0]) return;
      const a = res.assets[0];
      haptics.tap();
      setMeasuredSec(null);
      // Phones report the length in milliseconds. The web picker passes on the browser's value,
      // which is in seconds (or 0 when unknown), so on the web we measure the clip ourselves.
      const fromPicker = Platform.OS !== 'web' && a.duration && a.duration > 0 ? a.duration : null;
      setPicked({ uri: a.uri, durationMs: fromPicker });
    } catch {
      setError(t('upload.videosError'));
    }
  };

  const post = () => {
    if (!picked || !check?.ok) return;
    haptics.success();
    postShort({ video: { kind: 'uri', uri: picked.uri }, durationSec: check.seconds, caption });
    router.back();
  };

  const over = check && !check.ok;
  const pct = seconds != null ? Math.min(1, seconds / MAX_SHORT_SEC) : 0;

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <Rise>
            <Text style={s.kicker}>{t('upload.newShort')}</Text>
            <H1 style={{ marginTop: 4 }}>{t('upload.title')}</H1>
            <Muted style={{ marginTop: 6 }}>{t('upload.sub')}</Muted>
          </Rise>

          {!picked ? (
            <Rise delay={80} style={{ gap: 12 }}>
              <PressScale onPress={() => choose('library')} scaleTo={0.98} style={s.pickCard} accessibilityLabel={t('upload.choose')}>
                <View style={s.pickIcon}>
                  <Ionicons name="images-outline" size={28} color={colors.onFrost} />
                </View>
                <Text style={s.pickTitle}>{t('upload.choose')}</Text>
                <Text style={s.pickSub}>{t('upload.fromGallery')}</Text>
              </PressScale>
              {Platform.OS !== 'web' && (
                <PressScale onPress={() => choose('camera')} scaleTo={0.98} style={[s.pickCard, s.pickCardAlt]} accessibilityLabel={t('upload.record')}>
                  <View style={[s.pickIcon, { backgroundColor: colors.ember }]}>
                    <Ionicons name="videocam" size={26} color={colors.onFrost} />
                  </View>
                  <Text style={s.pickTitle}>{t('upload.record')}</Text>
                  <Text style={s.pickSub}>{t('upload.stopsAt')}</Text>
                </PressScale>
              )}
            </Rise>
          ) : (
            <Rise delay={40} style={{ gap: 16 }}>
              <View style={[s.preview, over && { borderColor: colors.danger }]}>
                <Preview key={picked.uri} uri={picked.uri} onDuration={setMeasuredSec} />
                <View style={s.durChip}>
                  <Ionicons name={check == null ? 'time-outline' : check.ok ? 'checkmark-circle' : 'alert-circle'} size={13} color={check == null ? '#fff' : check.ok ? colors.glow : colors.danger} />
                  <Text style={s.durText}>{seconds != null ? formatDuration(seconds) : t('upload.checking')}</Text>
                </View>
                <PressScale onPress={() => setPicked(null)} containerStyle={s.changeWrap} style={s.changeBtn} accessibilityLabel={t('upload.change')}>
                  <Ionicons name="swap-horizontal" size={14} color="#fff" />
                  <Text style={s.changeText}>{t('upload.changeShort')}</Text>
                </PressScale>
              </View>

              <View style={{ gap: 8 }}>
                <View style={s.meterHead}>
                  <Text style={s.meterLabel}>{t('upload.length')}</Text>
                  <Text style={[s.meterLabel, over && { color: colors.danger }]}>{seconds != null ? t('upload.of', { len: formatDuration(seconds) }) : '–'}</Text>
                </View>
                <View style={s.meter}>
                  <View style={[s.meterFill, { width: `${pct * 100}%`, backgroundColor: over ? colors.danger : colors.glow }]} />
                </View>
                {check && !check.ok && <Text style={s.error}>{seconds != null && seconds > MAX_SHORT_SEC ? t('upload.tooLong', { len: formatDuration(seconds) }) : t('upload.unreadable')}</Text>}
              </View>

              <View style={s.captionBox}>
                <TextInput
                  style={s.caption}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder={t('upload.caption')}
                  placeholderTextColor={colors.faint}
                  multiline
                  maxLength={300}
                />
                <Text style={s.counter}>{caption.length}/300</Text>
              </View>

              <Button label={t('upload.postShort')} icon={<Ionicons name="arrow-up-circle" size={18} color={colors.onFrost} />} disabled={!check?.ok} onPress={post} />
              {Platform.OS === 'web' && <Text style={s.small}>{t('upload.webNote')}</Text>}
            </Rise>
          )}

          {error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <View style={s.rules}>
            <Text style={s.rulesTitle}>{t('upload.rulesTitle')}</Text>
            <Text style={s.rulesText}>{t('upload.rules')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 22, gap: 22 },
  kicker: { fontFamily: font, color: colors.ember, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  pickCard: { alignItems: 'center', gap: 6, paddingVertical: 34, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(228,228,230,0.22)' },
  pickCardAlt: { paddingVertical: 22, borderStyle: 'solid', borderWidth: 1, borderColor: colors.border },
  pickIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost, marginBottom: 6 },
  pickTitle: { fontFamily: display, color: colors.text, fontSize: 26, fontWeight: '700' },
  pickSub: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600' },

  preview: { alignSelf: 'center', width: '62%', aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1.5, borderColor: colors.border },
  durChip: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)' },
  durText: { fontFamily: font, color: '#fff', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  changeWrap: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)' },
  changeText: { fontFamily: font, color: '#fff', fontSize: 12, fontWeight: '800' },

  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '800' },
  meter: { height: 6, borderRadius: 3, backgroundColor: colors.card, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3 },
  error: { fontFamily: font, color: colors.danger, fontSize: 13, lineHeight: 18, fontWeight: '700' },

  captionBox: { borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 },
  caption: { outlineWidth: 0, minHeight: 70, fontFamily: font, color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '600', textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '700' },
  small: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.dangerFill },
  errorText: { flex: 1, fontFamily: font, color: colors.danger, fontSize: 13, fontWeight: '700' },
  rules: { padding: 14, borderRadius: radius.md, backgroundColor: colors.card, gap: 4 },
  rulesTitle: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  rulesText: { fontFamily: font, color: colors.muted, fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
});
