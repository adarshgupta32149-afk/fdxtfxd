import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';

import type { Poster, PosterTone } from '@/lib/posters';
import { PERIOD_COPY, type Period } from '@/lib/time';
import { colors, display, font, radius } from '@/theme';

const TONES: Record<PosterTone, { bg: readonly [string, string, ...string[]]; ink: string; soft: string; light: boolean }> = {
  frost: { bg: ['#ECECEC', '#DCDCDD', '#C6C6CA'], ink: '#0B1324', soft: '#4A5163', light: true },
  navy: { bg: ['#1A2A55', '#0B1324'], ink: '#E4E4E6', soft: '#9AA6C2', light: false },
  ink: { bg: ['#2B3B66', '#121B33'], ink: '#E4E4E6', soft: '#9AA6C2', light: false },
  gold: { bg: ['#E9DDB9', '#C9B98C'], ink: '#231B05', soft: '#5A4B22', light: true },
  ember: { bg: ['#FFB386', '#E9733A'], ink: '#2A1408', soft: '#5E2E12', light: true },
};

const AUTO_MS = 4800;

/** A 4:3 poster slot that glides to the next poster every few seconds and can be swiped. */
export function PosterCarousel({ posters, period }: { posters: Poster[]; period: Period }) {
  const scroller = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const held = useRef(false);

  const show = (i: number, animated: boolean) => {
    indexRef.current = i;
    setIndex(i);
    if (width) scroller.current?.scrollTo({ x: i * width, animated });
  };

  useEffect(() => {
    if (!width || posters.length < 2) return;
    const timer = setInterval(() => {
      if (held.current) return;
      const next = (indexRef.current + 1) % posters.length;
      indexRef.current = next;
      setIndex(next);
      scroller.current?.scrollTo({ x: next * width, animated: true });
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [width, posters.length]);

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    show(Math.round(e.nativeEvent.contentOffset.x / width), false);
    held.current = false;
  };

  const current = posters[index] ?? posters[0];
  const lightDots = current ? TONES[current.tone].light && !current.imageUrl : false;

  return (
    <View
      style={s.frame}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityLabel={`Poster ${index + 1} of ${posters.length}`}
    >
      {width > 0 && (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => (held.current = true)}
          onMomentumScrollEnd={onSettle}
          scrollEventThrottle={32}
          style={StyleSheet.absoluteFill}
        >
          {posters.map((p) => (
            <View key={p.id} style={{ width, height: '100%' }}>
              {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <TextPoster poster={p} period={period} />}
            </View>
          ))}
        </ScrollView>
      )}
      {posters.length > 1 && (
        <View style={s.dots} pointerEvents="none">
          {posters.map((p, i) => (
            <View
              key={p.id}
              style={[
                s.dot,
                { backgroundColor: lightDots ? 'rgba(11,19,36,0.28)' : 'rgba(228,228,230,0.4)' },
                i === index && { width: 18, backgroundColor: lightDots ? colors.onFrost : colors.text },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function TextPoster({ poster, period }: { poster: Poster; period: Period }) {
  const t = TONES[poster.tone];
  return (
    <LinearGradient colors={t.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.poster}>
      <Text style={[s.mark, { color: t.ink }]} numberOfLines={1}>
        {poster.mark}
      </Text>
      <View style={s.topRow}>
        <View style={[s.badge, { backgroundColor: t.light ? 'rgba(11,19,36,0.10)' : 'rgba(7,11,22,0.45)' }]}>
          <Text style={[s.badgeText, { color: t.ink }]}>{PERIOD_COPY[period].label.toUpperCase()}</Text>
        </View>
        {poster.sample && <Text style={[s.sample, { color: t.soft }]}>Sample poster</Text>}
      </View>
      <View style={{ gap: 6 }}>
        <Text style={[s.headline, { color: t.ink }]}>{poster.lines.join('\n').toUpperCase()}</Text>
        <Text style={[s.caption, { color: t.soft }]}>{poster.caption}</Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  frame: { aspectRatio: 4 / 3, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  poster: { flex: 1, padding: 20, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontFamily: font, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sample: { fontFamily: font, fontSize: 10, fontWeight: '700' },
  mark: { position: 'absolute', right: -6, top: 4, fontFamily: display, fontSize: 150, lineHeight: 160, fontWeight: '700', opacity: 0.08 },
  headline: { fontFamily: display, fontSize: 44, lineHeight: 42, fontWeight: '700', letterSpacing: 0.2 },
  caption: { fontFamily: font, fontSize: 14, fontWeight: '600' },
  dots: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
