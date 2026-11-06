import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArticleRow, CategoryTag, ShortCard, VideoCard } from '@/components/LearnCards';
import { videoThumb } from '@/components/learnMedia';
import { PressScale, Rise } from '@/components/motion';
import { H1, Muted, Screen } from '@/components/ui';
import * as haptics from '@/lib/haptics';
import { ARTICLES, compactCount, relatedTo, VIDEOS, watchUrl } from '@/lib/learn';
import { SKILLS } from '@/lib/skills';
import { colors, display, font, radius } from '@/theme';

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const video = VIDEOS.find((v) => v.id === id);

  if (!video) {
    return (
      <Screen headerInset>
        <H1>Not found</H1>
        <Muted>This video is no longer in the library.</Muted>
      </Screen>
    );
  }

  const skill = SKILLS.find((x) => x.id === video.skillId);
  const guides = relatedTo(ARTICLES, video, 3);
  const similar = relatedTo(
    VIDEOS.filter((v) => v.short === video.short),
    video,
    4,
  );
  const watch = () => {
    haptics.press();
    void Linking.openURL(watchUrl(video));
  };

  return (
    <Screen headerInset contentStyle={{ gap: 22 }}>
      <Rise>
        <PressScale onPress={watch} scaleTo={0.98} accessibilityLabel={`Play ${video.title} on YouTube`}>
          <View style={[s.player, video.short && s.playerShort]}>
            <Image source={videoThumb(video.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient colors={['rgba(7,11,22,0.1)', 'rgba(7,11,22,0.55)']} style={StyleSheet.absoluteFill} />
            <View style={s.playCenter}>
              <View style={s.playRing}>
                <View style={s.play}>
                  <Ionicons name="play" size={30} color={colors.onFrost} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
            <View style={s.playerBottom}>
              <View style={s.yt}>
                <Ionicons name="logo-youtube" size={14} color="#FF4E45" />
                <Text style={s.ytText}>Plays on YouTube</Text>
              </View>
              <View style={s.duration}>
                <Text style={s.durationText}>{video.length}</Text>
              </View>
            </View>
          </View>
        </PressScale>
      </Rise>

      <Rise delay={70} style={{ gap: 10 }}>
        <View style={s.metaRow}>
          <CategoryTag category={video.category} />
          {video.short && (
            <View style={s.shortTag}>
              <Ionicons name="flash" size={10} color={colors.onFrost} />
              <Text style={s.shortTagText}>Short</Text>
            </View>
          )}
        </View>
        <Text style={s.title}>{video.title}</Text>
        <View style={s.channelRow}>
          <View style={s.channelMark}>
            <Text style={s.channelInitial}>{video.channel[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.channel}>{video.channel}</Text>
            <Text style={s.channelMeta}>
              {compactCount(video.views)} views · {video.age}
            </Text>
          </View>
        </View>
      </Rise>

      <Rise delay={120} style={s.actions}>
        <PressScale onPress={watch} containerStyle={{ flex: 1 }} style={s.watchBtn} accessibilityLabel="Watch on YouTube">
          <Ionicons name="play" size={16} color={colors.onFrost} />
          <Text style={s.watchText}>Watch</Text>
        </PressScale>
        {skill && (
          <PressScale
            onPress={() => router.push({ pathname: '/skills', params: { id: skill.id } })}
            containerStyle={{ flex: 1 }}
            style={s.ladderBtn}
            accessibilityLabel={`Open ${skill.name} ladder`}
          >
            <Ionicons name="git-network-outline" size={16} color={colors.glow} />
            <Text style={s.ladderText}>{skill.name} ladder</Text>
          </PressScale>
        )}
      </Rise>

      {guides.length > 0 && (
        <Rise delay={170} style={{ gap: 12 }}>
          <View style={s.headRow}>
            <View style={[s.bar, { backgroundColor: colors.glow }]} />
            <Text style={s.head}>Pairs with these guides</Text>
          </View>
          {guides.map((a) => (
            <ArticleRow key={a.id} article={a} />
          ))}
        </Rise>
      )}

      {similar.length > 0 && (
        <Rise delay={220} style={{ gap: 12 }}>
          <View style={s.headRow}>
            <View style={[s.bar, { backgroundColor: colors.ember }]} />
            <Text style={s.head}>More like this</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}>
            {similar.map((v) => (v.short ? <ShortCard key={v.id} video={v} /> : <VideoCard key={v.id} video={v} />))}
          </ScrollView>
        </Rise>
      )}

      <Text style={s.footer}>Video by {video.channel}. Cali links to it; we do not host or edit it.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  player: { aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navyPanel, borderWidth: 1, borderColor: colors.border },
  playerShort: { aspectRatio: 9 / 14, alignSelf: 'center', width: '72%' },
  playCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playRing: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(236,236,236,0.18)' },
  play: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frostHi },
  playerBottom: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  yt: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(7,11,22,0.72)', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 9 },
  ytText: { fontFamily: font, color: colors.text, fontSize: 11, fontWeight: '800' },
  duration: { backgroundColor: 'rgba(7,11,22,0.72)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  durationText: { fontFamily: font, color: colors.text, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shortTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.glow, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 7 },
  shortTagText: { fontFamily: font, color: colors.onFrost, fontSize: 10, fontWeight: '800' },
  title: { fontFamily: display, color: colors.text, fontSize: 34, lineHeight: 36, fontWeight: '700' },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  channelMark: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border },
  channelInitial: { fontFamily: display, color: colors.text, fontSize: 20, fontWeight: '700' },
  channel: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '800' },
  channelMeta: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10 },
  watchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.frost },
  watchText: { fontFamily: font, color: colors.onFrost, fontSize: 15, fontWeight: '800' },
  ladderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.glowSoft,
    borderWidth: 1,
    borderColor: 'rgba(158,194,255,0.3)',
  },
  ladderText: { fontFamily: font, color: colors.glow, fontSize: 15, fontWeight: '800' },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { width: 4, height: 20, borderRadius: 2 },
  head: { fontFamily: display, color: colors.text, fontSize: 26, lineHeight: 28, fontWeight: '700' },
  footer: { fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
