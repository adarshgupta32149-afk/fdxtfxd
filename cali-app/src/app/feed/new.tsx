import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale, Rise } from '@/components/motion';
import { Avatar } from '@/components/SocialUI';
import { Backdrop, Button, H1 } from '@/components/ui';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import * as haptics from '@/lib/haptics';
import { ME, personById, SPACES, type SpaceId } from '@/lib/social';
import { useSocial } from '@/state/SocialProvider';
import { colors, font, radius } from '@/theme';

export default function NewPostScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ space?: string }>();
  const { social, postToFeed } = useSocial();
  const { t } = useT();
  const [space, setSpace] = useState<SpaceId>((SPACES.find((x) => x.id === params.space)?.id ?? 'progress') as SpaceId);
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ uri: string; aspect: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const me = personById(social, ME);
  const canPost = text.trim().length > 0 || !!image;

  const pick = async () => {
    setError(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (res.canceled || !res.assets[0]) return;
      const a = res.assets[0];
      // Keep photos between Instagram's tallest (4:5) and widest (1.91:1) shapes.
      const aspect = a.width && a.height ? Math.min(1.91, Math.max(0.8, a.width / a.height)) : 1;
      setImage({ uri: a.uri, aspect });
    } catch {
      setError(t('upload.photosError'));
    }
  };

  const post = () => {
    if (!canPost) return;
    haptics.success();
    postToFeed({ space, text, image: image ? { kind: 'uri', uri: image.uri } : undefined, aspect: image?.aspect });
    router.back();
  };

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <Rise>
            <Text style={s.kicker}>{t('feed.newPost')}</Text>
            <H1 style={{ marginTop: 4 }}>{t('feed.shareIt')}</H1>
          </Rise>

          <Rise delay={60} style={{ gap: 10 }}>
            <Text style={s.label}>{t('feed.postIn')}</Text>
            <View style={s.spaces}>
              {SPACES.map((sp) => {
                const on = sp.id === space;
                return (
                  <PressScale key={sp.id} onPress={() => setSpace(sp.id)} style={[s.space, on && { backgroundColor: sp.color, borderColor: sp.color }]} accessibilityLabel={`${t('feed.postIn')}: ${t(`space.${sp.id}` as Key)}`}>
                    <Text style={[s.spaceText, on && { color: colors.onFrost }]}>{t(`space.${sp.id}` as Key)}</Text>
                  </PressScale>
                );
              })}
            </View>
            <Text style={s.blurb}>{t(`space.${space}.blurb` as Key)}</Text>
          </Rise>

          <Rise delay={110} style={s.editor}>
            <View style={s.editorHead}>
              <Avatar person={me} size={32} />
              <Text style={s.handle}>{me?.handle}</Text>
            </View>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder={space === 'questions' ? t('feed.phQuestion') : space === 'form' ? t('feed.phForm') : t('feed.phDefault')}
              placeholderTextColor={colors.faint}
              multiline
              maxLength={2000}
              autoFocus
            />
            {image ? (
              <View style={[s.photo, { aspectRatio: image.aspect }]}>
                <Image source={{ uri: image.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <PressScale onPress={() => setImage(null)} containerStyle={s.removeWrap} style={s.removePhoto} accessibilityLabel={t('feed.removePhoto')}>
                  <Ionicons name="close" size={16} color="#fff" />
                </PressScale>
              </View>
            ) : (
              <PressScale onPress={pick} style={s.addPhoto} accessibilityLabel={t('feed.addPhoto')}>
                <Ionicons name="image-outline" size={18} color={colors.text} />
                <Text style={s.addPhotoText}>{t('feed.addPhoto')}</Text>
              </PressScale>
            )}
            <Text style={s.counter}>{text.length}/2000</Text>
          </Rise>

          {error && <Text style={s.error}>{error}</Text>}
          <Button label={t('feed.post')} icon={<Ionicons name="arrow-up-circle" size={18} color={colors.onFrost} />} disabled={!canPost} onPress={post} />
          {Platform.OS === 'web' && image && <Text style={s.small}>{t('feed.webPhotos')}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 22, gap: 22 },
  kicker: { fontFamily: font, color: '#F2A7C3', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  label: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  spaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  space: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  spaceText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  blurb: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },
  editor: { gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  editorHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '800' },
  input: { outlineWidth: 0, minHeight: 110, fontFamily: font, color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '600', textAlignVertical: 'top' },
  photo: { width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.navyPanel },
  removeWrap: { position: 'absolute', top: 8, right: 8 },
  removePhoto: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  addPhoto: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.cardRaised },
  addPhotoText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },
  counter: { alignSelf: 'flex-end', fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '700' },
  error: { fontFamily: font, color: colors.danger, fontSize: 13, fontWeight: '700' },
  small: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
