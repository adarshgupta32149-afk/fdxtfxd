import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { articleImage, videoThumb } from '@/components/learnMedia';
import { PressScale } from '@/components/motion';
import { categoryOf, compactCount, type Article, type LearnCategory, type Video } from '@/lib/learn';
import { colors, display, font, radius } from '@/theme';

/** Small coloured label for a Learn category. */
export function CategoryTag({ category, onImage }: { category: LearnCategory; onImage?: boolean }) {
  const c = categoryOf(category);
  return (
    <View style={[s.tag, onImage && s.tagOnImage]}>
      <View style={[s.tagDot, { backgroundColor: c.color }]} />
      <Text style={[s.tagText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const openVideo = (v: Video) => router.push({ pathname: '/learn/video/[id]', params: { id: v.id } });
const openArticle = (a: Article) => router.push({ pathname: '/learn/[id]', params: { id: a.id } });

function PlayBadge({ size = 46 }: { size?: number }) {
  return (
    <View style={[s.play, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="play" size={size * 0.42} color={colors.onFrost} style={{ marginLeft: size * 0.06 }} />
    </View>
  );
}

/** Big 16:9 video card for the top of the Videos section. */
export function FeaturedVideoCard({ video }: { video: Video }) {
  return (
    <PressScale onPress={() => openVideo(video)} scaleTo={0.98} accessibilityLabel={`Video: ${video.title}`}>
      <View style={s.featureVideo}>
        <Image source={videoThumb(video.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(7,11,22,0)', 'rgba(7,11,22,0.25)', 'rgba(7,11,22,0.92)']} style={StyleSheet.absoluteFill} />
        <View style={s.featureTop}>
          <CategoryTag category={video.category} onImage />
          <View style={s.duration}>
            <Text style={s.durationText}>{video.length}</Text>
          </View>
        </View>
        <View style={s.featureCenter}>
          <PlayBadge size={58} />
        </View>
        <View style={s.featureBottom}>
          <Text style={s.featureTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={s.featureMeta}>
            {video.channel} · {compactCount(video.views)} views
          </Text>
        </View>
      </View>
    </PressScale>
  );
}

/** Compact video card for the horizontal carousel. */
export function VideoCard({ video, style }: { video: Video; style?: StyleProp<ViewStyle> }) {
  return (
    <PressScale onPress={() => openVideo(video)} scaleTo={0.97} style={[s.videoCard, style]} accessibilityLabel={`Video: ${video.title}`}>
      <View style={s.videoThumbWrap}>
        <Image source={videoThumb(video.id)} style={s.videoThumb} resizeMode="cover" />
        <View style={s.videoPlaySmall}>
          <PlayBadge size={34} />
        </View>
        <View style={[s.duration, s.durationCorner]}>
          <Text style={s.durationText}>{video.length}</Text>
        </View>
      </View>
      <View style={{ gap: 4, paddingHorizontal: 2 }}>
        <Text style={s.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={s.videoMeta} numberOfLines={1}>
          {video.channel} · {compactCount(video.views)}
        </Text>
      </View>
    </PressScale>
  );
}

/** Vertical card for YouTube Shorts. */
export function ShortCard({ video }: { video: Video }) {
  return (
    <PressScale onPress={() => openVideo(video)} scaleTo={0.96} style={s.short} accessibilityLabel={`Short: ${video.title}`}>
      <Image source={videoThumb(video.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient colors={['rgba(7,11,22,0)', 'rgba(7,11,22,0.9)']} start={{ x: 0, y: 0.45 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={s.shortBadge}>
        <Ionicons name="flash" size={10} color={colors.onFrost} />
        <Text style={s.shortBadgeText}>{video.length}</Text>
      </View>
      <View style={s.shortBottom}>
        <Text style={s.shortTitle} numberOfLines={3}>
          {video.title}
        </Text>
        <Text style={s.shortMeta}>{compactCount(video.views)} views</Text>
      </View>
    </PressScale>
  );
}

/** Large article card: photo with the title set on it. */
export function FeaturedArticleCard({ article }: { article: Article }) {
  return (
    <PressScale onPress={() => openArticle(article)} scaleTo={0.98} accessibilityLabel={`Article: ${article.title}`}>
      <View style={s.featureArticle}>
        <Image source={articleImage(article.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(7,11,22,0.05)', 'rgba(7,11,22,0.35)', 'rgba(7,11,22,0.95)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View style={s.featureTop}>
          <CategoryTag category={article.category} onImage />
          <View style={s.duration}>
            <Ionicons name="time-outline" size={11} color={colors.text} />
            <Text style={s.durationText}>{article.minutes} min</Text>
          </View>
        </View>
        <View style={s.featureBottom}>
          <Text style={s.articleFeatureTitle} numberOfLines={3}>
            {article.title}
          </Text>
          <Text style={s.featureDek} numberOfLines={2}>
            {article.dek}
          </Text>
          <Text style={s.featureMeta}>{article.source}</Text>
        </View>
      </View>
    </PressScale>
  );
}

/** List row for an article: thumbnail, tag, title, source and read time. */
export function ArticleRow({ article }: { article: Article }) {
  return (
    <PressScale onPress={() => openArticle(article)} scaleTo={0.98} style={s.row} accessibilityLabel={`Article: ${article.title}`}>
      <Image source={articleImage(article.id)} style={s.rowThumb} resizeMode="cover" />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <CategoryTag category={article.category} />
        <Text style={s.rowTitle} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={s.rowMeta} numberOfLines={1}>
          {article.source} · {article.minutes} min read
        </Text>
      </View>
    </PressScale>
  );
}

const s = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  tagOnImage: { backgroundColor: 'rgba(7,11,22,0.62)', paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontFamily: font, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  play: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frostHi },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(7,11,22,0.72)', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 8 },
  durationCorner: { position: 'absolute', right: 8, bottom: 8 },
  durationText: { fontFamily: font, color: colors.text, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },

  featureVideo: { aspectRatio: 16 / 10, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navyPanel, borderWidth: 1, borderColor: colors.border },
  featureTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  featureBottom: { position: 'absolute', left: 16, right: 16, bottom: 14, gap: 4 },
  featureTitle: { fontFamily: display, color: colors.text, fontSize: 26, lineHeight: 28, fontWeight: '700' },
  featureMeta: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '700' },

  videoCard: { width: 240, gap: 10 },
  videoThumbWrap: { aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.navyPanel, borderWidth: 1, borderColor: colors.border },
  videoThumb: { width: '100%', height: '100%' },
  videoPlaySmall: { position: 'absolute', left: 10, bottom: 10 },
  videoTitle: { fontFamily: font, color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  videoMeta: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },

  short: { width: 136, aspectRatio: 9 / 16, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.navyPanel, borderWidth: 1, borderColor: colors.border },
  shortBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.sage,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 7,
  },
  shortBadgeText: { fontFamily: font, color: colors.onFrost, fontSize: 10, fontWeight: '800' },
  shortBottom: { position: 'absolute', left: 10, right: 10, bottom: 10, gap: 3 },
  shortTitle: { fontFamily: font, color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  shortMeta: { fontFamily: font, color: colors.muted, fontSize: 10, fontWeight: '700' },

  featureArticle: { aspectRatio: 4 / 4.4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navyPanel, borderWidth: 1, borderColor: colors.border },
  articleFeatureTitle: { fontFamily: display, color: colors.text, fontSize: 32, lineHeight: 33, fontWeight: '700' },
  featureDek: { fontFamily: font, color: '#C9CDD8', fontSize: 13, lineHeight: 18, fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  rowThumb: { width: 84, height: 84, borderRadius: 14, backgroundColor: colors.navyPanel },
  rowTitle: { fontFamily: font, color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  rowMeta: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },
});
