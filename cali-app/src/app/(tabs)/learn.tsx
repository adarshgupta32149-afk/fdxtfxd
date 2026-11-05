import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArticleRow, FeaturedArticleCard, FeaturedVideoCard, ShortCard, VideoCard } from '@/components/LearnCards';
import { articleImage, videoThumb } from '@/components/learnMedia';
import { PressScale, Rise } from '@/components/motion';
import { skillIcon } from '@/components/skillIcons';
import { H1, Muted, Screen } from '@/components/ui';
import * as haptics from '@/lib/haptics';
import { ARTICLES, CATEGORIES, forFocus, inCategory, VIDEOS, type LearnCategory } from '@/lib/learn';
import { completedStepIds, skillProgress } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, mossGradient, radius } from '@/theme';

type Filter = LearnCategory | 'all';

function SectionTitle({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <View style={s.sectionRow}>
      <View style={[s.sectionBar, { backgroundColor: color }]} />
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionCount}>{count}</Text>
    </View>
  );
}

/** A matte green card that ties the library to the skill the user is working on. */
function PickedForYou({ skillId }: { skillId: string }) {
  const { state } = useAppState();
  const skill = SKILLS.find((x) => x.id === skillId);
  const completed = useMemo(() => completedStepIds(state), [state]);
  const video = VIDEOS.find((v) => v.skillId === skillId && !v.short);
  const article = ARTICLES.find((a) => a.skillId === skillId);
  if (!skill || (!video && !article)) return null;
  const next = skillProgress(skill, completed).nextStep;

  return (
    <LinearGradient colors={mossGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.picked}>
      <View style={s.pickedHead}>
        <View style={s.pickedIcon}>
          <Ionicons name={skillIcon(skill.id)} size={18} color={colors.mossDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pickedKicker}>Picked for your {skill.name.toLowerCase()}</Text>
          <Text style={s.pickedTitle} numberOfLines={2}>
            {next ? `Next up: ${next.name}` : 'Ladder complete. Keep it sharp.'}
          </Text>
        </View>
      </View>
      {video && (
        <PressScale onPress={() => router.push({ pathname: '/learn/video/[id]', params: { id: video.id } })} scaleTo={0.98} style={s.pickedRow} accessibilityLabel={`Watch ${video.title}`}>
          <Image source={videoThumb(video.id)} style={s.pickedThumb} />
          <View style={s.pickedPlay}>
            <Ionicons name="play" size={12} color={colors.mossDeep} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.pickedType}>Watch · {video.length}</Text>
            <Text style={s.pickedItem} numberOfLines={2}>
              {video.title}
            </Text>
          </View>
        </PressScale>
      )}
      {article && (
        <PressScale onPress={() => router.push({ pathname: '/learn/[id]', params: { id: article.id } })} scaleTo={0.98} style={s.pickedRow} accessibilityLabel={`Read ${article.title}`}>
          <Image source={articleImage(article.id)} style={s.pickedThumb} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.pickedType}>Read · {article.minutes} min</Text>
            <Text style={s.pickedItem} numberOfLines={2}>
              {article.title}
            </Text>
          </View>
        </PressScale>
      )}
    </LinearGradient>
  );
}

export default function LearnScreen() {
  const { state } = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const focus = state.focusSkills;

  // Focus skills float to the top of both sections.
  const videos = useMemo(() => forFocus(inCategory(VIDEOS.filter((v) => !v.short), filter), focus), [filter, focus]);
  const shorts = useMemo(() => forFocus(inCategory(VIDEOS.filter((v) => v.short), filter), focus), [filter, focus]);
  const articles = useMemo(() => forFocus(inCategory(ARTICLES, filter), focus), [filter, focus]);
  const [featuredVideo, ...moreVideos] = videos;
  const [featuredArticle, ...moreArticles] = articles;
  const active = filter === 'all' ? null : CATEGORIES.find((c) => c.id === filter);

  return (
    <Screen topInset tabBar contentStyle={{ gap: 22 }}>
      <Rise>
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>
              {ARTICLES.length} guides · {VIDEOS.length} videos
            </Text>
            <H1 style={{ marginTop: 4 }}>Learn</H1>
          </View>
          <View style={s.headBadge}>
            <Ionicons name="sparkles" size={14} color={colors.mossDeep} />
          </View>
        </View>
        <Muted style={{ marginTop: 6 }}>The best guides and videos we could find, broken down step by step for your ladders.</Muted>
      </Rise>

      {filter === 'all' && focus[0] && (
        <Rise delay={60}>
          <PickedForYou skillId={focus[0]} />
        </Rise>
      )}

      <Rise delay={110}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsWrap} contentContainerStyle={s.chips}>
          {([{ id: 'all', label: 'All', color: colors.frost }, ...CATEGORIES] as const).map((c) => {
            const on = filter === c.id;
            return (
              <PressScale
                key={c.id}
                onPress={() => {
                  haptics.tap();
                  setFilter(c.id as Filter);
                }}
                haptic="none"
                style={[s.chip, on && { backgroundColor: c.color, borderColor: c.color }]}
                accessibilityLabel={`Show ${c.label}`}
              >
                {c.id !== 'all' && <View style={[s.chipDot, { backgroundColor: on ? colors.onFrost : c.color }]} />}
                <Text style={[s.chipText, on && { color: colors.onFrost }]}>{c.label}</Text>
              </PressScale>
            );
          })}
        </ScrollView>
      </Rise>

      {/* Keyed by filter so each section replays its entrance when the filter changes. */}
      <View key={filter} style={{ gap: 22 }}>
        <Rise delay={140} style={{ gap: 14 }}>
          <SectionTitle title="Videos" count={videos.length + shorts.length} color={active?.color ?? colors.ember} />
          {featuredVideo ? <FeaturedVideoCard video={featuredVideo} /> : <Muted>No videos in {active?.label} yet.</Muted>}
          {moreVideos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.railWrap} contentContainerStyle={s.rail} decelerationRate="fast" snapToInterval={252}>
              {moreVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </ScrollView>
          )}
          {shorts.length > 0 && (
            <View style={{ gap: 10 }}>
              <View style={s.shortsHead}>
                <Ionicons name="flash" size={14} color={colors.sage} />
                <Text style={s.shortsLabel}>Under a minute</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.railWrap} contentContainerStyle={s.rail}>
                {shorts.map((v) => (
                  <ShortCard key={v.id} video={v} />
                ))}
              </ScrollView>
            </View>
          )}
        </Rise>

        <Rise delay={220} style={{ gap: 14 }}>
          <SectionTitle title="Articles" count={articles.length} color={active?.color ?? colors.sage} />
          {featuredArticle ? <FeaturedArticleCard article={featuredArticle} /> : <Muted>No articles in {active?.label} yet.</Muted>}
          <View style={{ gap: 10 }}>
            {moreArticles.map((a) => (
              <ArticleRow key={a.id} article={a} />
            ))}
          </View>
        </Rise>
      </View>

      <Text style={s.footer}>
        Every guide links to its original. Videos open on YouTube. Breakdowns are written by Cali; photos credited on each guide.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-end' },
  kicker: { fontFamily: font, color: colors.sage, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  headBadge: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage, marginBottom: 6 },

  picked: { borderRadius: radius.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(143,211,174,0.22)' },
  pickedHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickedIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  pickedKicker: { fontFamily: font, color: colors.sage, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  pickedTitle: { fontFamily: display, color: colors.text, fontSize: 24, lineHeight: 26, fontWeight: '700' },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 16, backgroundColor: 'rgba(7,11,22,0.35)' },
  pickedThumb: { width: 76, height: 52, borderRadius: 10 },
  pickedPlay: { position: 'absolute', left: 38, top: 25, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  pickedType: { fontFamily: font, color: colors.sage, fontSize: 11, fontWeight: '800' },
  pickedItem: { fontFamily: font, color: colors.text, fontSize: 13, lineHeight: 17, fontWeight: '700' },

  chipsWrap: { marginHorizontal: -22 },
  chips: { gap: 8, paddingHorizontal: 22 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '800' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { fontFamily: display, color: colors.text, fontSize: 30, lineHeight: 32, fontWeight: '700' },
  sectionCount: { fontFamily: font, color: colors.faint, fontSize: 13, fontWeight: '800', marginLeft: 'auto' },

  railWrap: { marginHorizontal: -22 },
  rail: { gap: 12, paddingHorizontal: 22 },
  shortsHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shortsLabel: { fontFamily: font, color: colors.sage, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },

  footer: { fontFamily: font, color: colors.faint, fontSize: 11, lineHeight: 16, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
