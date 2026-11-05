import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Animated, Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArticleRow, CategoryTag, VideoCard } from '@/components/LearnCards';
import { articleImage } from '@/components/learnMedia';
import { PressScale, Rise } from '@/components/motion';
import { Backdrop, Button, H1, Muted } from '@/components/ui';
import { ARTICLES, categoryOf, formatPublished, relatedTo, VIDEOS } from '@/lib/learn';
import { SKILLS } from '@/lib/skills';
import { colors, display, font, mossGradient, radius } from '@/theme';

const HERO = 340;

function Block({ title, color, children, delay }: { title: string; color: string; children: React.ReactNode; delay: number }) {
  return (
    <Rise delay={delay} style={{ gap: 14 }}>
      <View style={s.blockHead}>
        <View style={[s.blockBar, { backgroundColor: color }]} />
        <Text style={s.blockTitle}>{title}</Text>
      </View>
      {children}
    </Rise>
  );
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollY = useState(() => new Animated.Value(0))[0];
  const [contentH, setContentH] = useState(1);
  const [viewH, setViewH] = useState(1);
  const article = ARTICLES.find((a) => a.id === id);

  if (!article) {
    return (
      <Backdrop>
        <View style={{ padding: 22, paddingTop: insets.top + 70, gap: 8 }}>
          <H1>Not found</H1>
          <Muted>This guide is no longer in the library.</Muted>
        </View>
      </Backdrop>
    );
  }

  const cat = categoryOf(article.category);
  const skill = SKILLS.find((x) => x.id === article.skillId);
  const videos = relatedTo(VIDEOS.filter((v) => !v.short), article, 4);
  const more = relatedTo(ARTICLES, article, 3);
  const scrollable = Math.max(1, contentH - viewH);

  return (
    <Backdrop>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        onContentSizeChange={(_, h) => setContentH(h)}
        onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
      >
        {/* Hero photo: drifts slower than the page and stretches when you pull down. */}
        <Animated.View
          style={{
            height: HERO,
            transform: [
              { translateY: scrollY.interpolate({ inputRange: [-200, 0, HERO], outputRange: [-100, 0, HERO * 0.45], extrapolateRight: 'clamp' }) },
              { scale: scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.6, 1], extrapolateRight: 'clamp' }) },
            ],
          }}
        >
          <Animated.Image source={articleImage(article.id)} style={{ width, height: HERO }} resizeMode="cover" />
          <LinearGradient colors={['rgba(7,11,22,0.55)', 'rgba(7,11,22,0)', 'rgba(7,11,22,0.6)', colors.bg]} locations={[0, 0.3, 0.75, 1]} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <View style={[s.body, { paddingBottom: insets.bottom + 48 }]}>
          <Rise style={{ gap: 12 }}>
            <View style={s.metaRow}>
              <CategoryTag category={article.category} />
              <Text style={s.metaDot}>·</Text>
              <Text style={s.metaText}>{article.minutes} min read</Text>
            </View>
            <Text style={s.title}>{article.title}</Text>
            <Text style={s.dek}>{article.dek}</Text>
            <View style={s.byline}>
              <View style={[s.sourceMark, { backgroundColor: cat.color }]}>
                <Text style={s.sourceInitial}>{article.source[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bylineSource}>{article.source}</Text>
                <Text style={s.bylineMeta}>
                  {article.author} · {formatPublished(article.published)}
                  {article.updated ? ` · updated ${formatPublished(article.updated)}` : ''}
                </Text>
              </View>
            </View>
          </Rise>

          <Block title="The short version" color={cat.color} delay={80}>
            {article.summary.map((p, i) => (
              <Text key={i} style={s.para}>
                {p}
              </Text>
            ))}
          </Block>

          {article.steps && (
            <Block title={article.stepsTitle ?? 'Step by step'} color={cat.color} delay={140}>
              <View>
                {article.steps.map((st, i) => {
                  const last = i === article.steps!.length - 1;
                  return (
                    <View key={st.name} style={s.step}>
                      <View style={s.stepRail}>
                        <View style={[s.stepNum, { borderColor: cat.color }]}>
                          <Text style={[s.stepNumText, { color: cat.color }]}>{i + 1}</Text>
                        </View>
                        {!last && <View style={s.stepLine} />}
                      </View>
                      <View style={[s.stepBody, last && { paddingBottom: 0 }]}>
                        <Text style={s.stepName}>{st.name}</Text>
                        <Text style={s.stepHow}>{st.how}</Text>
                        {st.pass && (
                          <View style={s.pass}>
                            <Ionicons name="flag" size={11} color={colors.mossDeep} />
                            <Text style={s.passText}>{st.pass}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Block>
          )}

          {article.mistakes && (
            <Block title="Mistakes to avoid" color={colors.danger} delay={180}>
              <View style={{ gap: 10 }}>
                {article.mistakes.map((m) => (
                  <View key={m.name} style={s.mistake}>
                    <View style={s.mistakeHead}>
                      <Ionicons name="close-circle" size={16} color={colors.danger} />
                      <Text style={s.mistakeName}>{m.name}</Text>
                    </View>
                    <View style={s.mistakeFix}>
                      <Ionicons name="arrow-forward" size={13} color={colors.sage} style={{ marginTop: 2 }} />
                      <Text style={s.mistakeFixText}>{m.fix}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Block>
          )}

          <Block title="Worth remembering" color={colors.gold} delay={220}>
            <View style={{ gap: 12 }}>
              {article.takeaways.map((t) => (
                <View key={t} style={s.takeaway}>
                  <View style={s.takeawayDot} />
                  <Text style={s.takeawayText}>{t}</Text>
                </View>
              ))}
            </View>
          </Block>

          <Rise delay={260}>
            <LinearGradient colors={mossGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tryCard}>
              <View style={s.tryHead}>
                <Ionicons name="flash" size={14} color={colors.sage} />
                <Text style={s.tryKicker}>Try it in Cali</Text>
              </View>
              <Text style={s.tryText}>{article.caliTip}</Text>
              <View style={s.tryActions}>
                {skill && (
                  <PressScale
                    onPress={() => router.push({ pathname: '/skills', params: { id: skill.id } })}
                    style={s.tryBtn}
                    accessibilityLabel={`Open ${skill.name} ladder`}
                  >
                    <Text style={s.tryBtnText}>{skill.name} ladder</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.mossDeep} />
                  </PressScale>
                )}
                <PressScale onPress={() => router.push('/workout/new')} style={[s.tryBtn, s.tryBtnGhost]} accessibilityLabel="Start a session">
                  <Ionicons name="play" size={12} color={colors.sage} />
                  <Text style={[s.tryBtnText, { color: colors.sage }]}>Start session</Text>
                </PressScale>
              </View>
            </LinearGradient>
          </Rise>

          {article.note && (
            <View style={s.note}>
              <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
              <Text style={s.noteText}>{article.note}</Text>
            </View>
          )}

          <Button
            label={`Read the original on ${article.source}`}
            variant="glass"
            icon={<Ionicons name="open-outline" size={16} color={colors.text} />}
            onPress={() => void Linking.openURL(article.url)}
          />
          {article.photoCredit && (
            <Text style={s.credit}>
              Photo: {article.photoCredit.text} ({article.photoCredit.license}, Wikimedia Commons). The original article image is no longer online.
            </Text>
          )}

          {videos.length > 0 && (
            <View style={{ gap: 14 }}>
              <View style={s.blockHead}>
                <View style={[s.blockBar, { backgroundColor: colors.ember }]} />
                <Text style={s.blockTitle}>Watch next</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}>
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </ScrollView>
            </View>
          )}

          {more.length > 0 && (
            <View style={{ gap: 14 }}>
              <View style={s.blockHead}>
                <View style={[s.blockBar, { backgroundColor: colors.sage }]} />
                <Text style={s.blockTitle}>Read next</Text>
              </View>
              <View style={{ gap: 10 }}>
                {more.map((a) => (
                  <ArticleRow key={a.id} article={a} />
                ))}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Header fade appears once the hero photo has scrolled away, so the back button stays readable. */}
      <Animated.View pointerEvents="none" style={[s.topFade, { height: insets.top + 72, opacity: scrollY.interpolate({ inputRange: [HERO - 140, HERO - 40], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
        <LinearGradient colors={['rgba(7,11,22,0.96)', 'rgba(7,11,22,0.75)', 'rgba(7,11,22,0)']} locations={[0, 0.6, 1]} style={{ flex: 1 }} />
      </Animated.View>

      {/* Reading progress, pinned under the status bar. */}
      <View pointerEvents="none" style={[s.progressTrack, { top: insets.top }]}>
        <Animated.View
          style={[
            s.progressFill,
            {
              backgroundColor: cat.color,
              width,
              transform: [
                { translateX: scrollY.interpolate({ inputRange: [0, scrollable], outputRange: [-width, 0], extrapolate: 'clamp' }) },
              ],
            },
          ]}
        />
      </View>
    </Backdrop>
  );
}

const s = StyleSheet.create({
  body: { marginTop: -60, paddingHorizontal: 22, gap: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { color: colors.faint, fontSize: 12 },
  metaText: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '700' },
  title: { fontFamily: display, color: colors.text, fontSize: 40, lineHeight: 41, fontWeight: '700' },
  dek: { fontFamily: font, color: '#C3C8D4', fontSize: 16, lineHeight: 23, fontWeight: '600' },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  sourceMark: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceInitial: { fontFamily: display, color: colors.onFrost, fontSize: 20, fontWeight: '700' },
  bylineSource: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '800' },
  bylineMeta: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },

  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blockBar: { width: 4, height: 20, borderRadius: 2 },
  blockTitle: { fontFamily: display, color: colors.text, fontSize: 26, lineHeight: 28, fontWeight: '700' },
  para: { fontFamily: font, color: '#CDD1DB', fontSize: 15.5, lineHeight: 25, fontWeight: '500' },

  step: { flexDirection: 'row', gap: 14 },
  stepRail: { width: 30, alignItems: 'center' },
  stepNum: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  stepNumText: { fontFamily: display, fontSize: 16, fontWeight: '700' },
  stepLine: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1, backgroundColor: colors.border },
  stepBody: { flex: 1, minWidth: 0, paddingTop: 4, paddingBottom: 22, gap: 5 },
  stepName: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '800' },
  stepHow: { fontFamily: font, color: colors.muted, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  pass: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 4, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: colors.sage },
  passText: { fontFamily: font, color: colors.mossDeep, fontSize: 12, fontWeight: '800' },

  mistake: { padding: 14, gap: 8, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  mistakeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mistakeName: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '800' },
  mistakeFix: { flexDirection: 'row', gap: 8 },
  mistakeFixText: { flex: 1, fontFamily: font, color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '500' },

  takeaway: { flexDirection: 'row', gap: 12 },
  takeawayDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: colors.gold },
  takeawayText: { flex: 1, fontFamily: font, color: '#CDD1DB', fontSize: 15, lineHeight: 22, fontWeight: '600' },

  tryCard: { borderRadius: radius.lg, padding: 18, gap: 10, borderWidth: 1, borderColor: 'rgba(143,211,174,0.22)' },
  tryHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tryKicker: { fontFamily: font, color: colors.sage, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  tryText: { fontFamily: font, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  tryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.sage },
  tryBtnGhost: { backgroundColor: 'rgba(143,211,174,0.12)', borderWidth: 1, borderColor: 'rgba(143,211,174,0.3)' },
  tryBtnText: { fontFamily: font, color: colors.mossDeep, fontSize: 13, fontWeight: '800' },

  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.card },
  noteText: { flex: 1, fontFamily: font, color: colors.muted, fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
  credit: { fontFamily: font, color: colors.faint, fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: -16 },

  topFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  progressTrack: { position: 'absolute', left: 0, right: 0, height: 3, overflow: 'hidden' },
  progressFill: { height: 3 },
});
