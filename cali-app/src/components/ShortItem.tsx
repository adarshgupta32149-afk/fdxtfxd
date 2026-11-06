import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvent } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { PressScale } from '@/components/motion';
import { imageSource, videoSource } from '@/components/socialMedia';
import { Avatar } from '@/components/SocialUI';
import * as haptics from '@/lib/haptics';
import { ME, personById, shortCount, timeAgo, type Short, type SocialState } from '@/lib/social';
import { colors, font } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function RailButton({ icon, count, color, onPress, label }: { icon: IconName; count?: string; color?: string; onPress: () => void; label: string }) {
  return (
    <PressScale onPress={onPress} scaleTo={0.85} haptic="none" style={s.rail} accessibilityLabel={label}>
      <Ionicons name={icon} size={31} color={color ?? '#fff'} style={s.railShadow} />
      {count !== undefined && <Text style={s.railCount}>{count}</Text>}
    </PressScale>
  );
}

/** A heart that pops where the user double-tapped. */
export function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const t = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.sequence([
      Animated.spring(t, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }),
      Animated.timing(t, { toValue: 2, duration: 380, delay: 220, useNativeDriver: true }),
    ]).start(onDone);
  }, [t, onDone]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 50,
        top: y - 50,
        opacity: t.interpolate({ inputRange: [0, 0.2, 1, 2], outputRange: [0, 1, 1, 0] }),
        transform: [
          { scale: t.interpolate({ inputRange: [0, 1, 2], outputRange: [0.3, 1, 1.5] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '-8deg'] }) },
          { translateY: t.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, -60] }) },
        ],
      }}
    >
      <Ionicons name="heart" size={100} color={colors.heart} />
    </Animated.View>
  );
}

// expo-video players are native objects controlled by setting properties. These helpers keep
// those writes out of the component body, where React's lint rules treat hook values as frozen.
function rewind(player: VideoPlayer) {
  player.currentTime = 0;
}
function setMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

export function ShortItem({
  short,
  social,
  height,
  active,
  muted,
  bottomInset,
  onToggleMute,
  onLike,
  onDoubleLike,
  onComments,
  onShare,
  onSave,
  onMore,
}: {
  short: Short;
  social: SocialState;
  height: number;
  active: boolean;
  muted: boolean;
  bottomInset: number;
  onToggleMute: () => void;
  onLike: () => void;
  onDoubleLike: () => void;
  onComments: () => void;
  onShare: () => void;
  onSave: () => void;
  onMore: () => void;
}) {
  const player = useVideoPlayer(videoSource(short.video), (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.2;
  });
  const [paused, setPaused] = useState(false);
  const [now] = useState(() => new Date());
  const [expanded, setExpanded] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTap = useRef(0);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const time = useEvent(player, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });

  // Only the Short on screen plays; it restarts from the top each time you land on it.
  useEffect(() => {
    if (active && !paused) player.play();
    else player.pause();
  }, [active, paused, player]);
  useEffect(() => {
    if (!active) rewind(player);
  }, [active, player]);
  useEffect(() => {
    setMuted(player, muted);
  }, [muted, player]);
  useEffect(() => () => {
    if (singleTimer.current) clearTimeout(singleTimer.current);
  }, []);

  const onTap = (e: GestureResponderEvent) => {
    const now = Date.now();
    const { locationX, locationY } = e.nativeEvent;
    if (now - lastTap.current < 280) {
      // Double tap: like, with a heart where the finger was.
      if (singleTimer.current) clearTimeout(singleTimer.current);
      lastTap.current = 0;
      haptics.press();
      setBurst({ x: locationX, y: locationY, key: now });
      onDoubleLike();
      return;
    }
    lastTap.current = now;
    singleTimer.current = setTimeout(() => setPaused((p) => !p), 280);
  };

  const author = personById(social, short.authorId);
  const progress = short.durationSec > 0 ? Math.min(1, (time?.currentTime ?? 0) / (player.duration || short.durationSec)) : 0;
  const poster = imageSource(short.poster);

  return (
    <View style={[s.item, { height }]}>
      {poster && <Image source={poster} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={18} />}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']} locations={[0, 0.18, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} accessibilityLabel={paused ? 'Play' : 'Pause'} />

      {paused && (
        <View pointerEvents="none" style={s.pausedWrap}>
          <View style={s.paused}>
            <Ionicons name="play" size={36} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </View>
      )}
      {burst && <HeartBurst key={burst.key} x={burst.x} y={burst.y} onDone={() => setBurst(null)} />}

      <View style={[s.railCol, { bottom: bottomInset + 24 }]}>
        <View style={s.railAvatar}>
          <Avatar person={author} size={44} ring />
          {short.authorId !== ME && (
            <View style={s.follow}>
              <Ionicons name="add" size={12} color="#fff" />
            </View>
          )}
        </View>
        <RailButton icon={short.liked ? 'heart' : 'heart-outline'} color={short.liked ? colors.heart : undefined} count={shortCount(short.likes)} onPress={onLike} label={short.liked ? 'Unlike' : 'Like'} />
        <RailButton icon="chatbubble-ellipses-outline" count={shortCount(short.comments.length)} onPress={onComments} label="Comments" />
        <RailButton icon="paper-plane-outline" count={shortCount(short.shares)} onPress={onShare} label="Share" />
        <RailButton icon={short.saved ? 'bookmark' : 'bookmark-outline'} color={short.saved ? colors.gold : undefined} onPress={onSave} label={short.saved ? 'Unsave' : 'Save'} />
        <RailButton icon="ellipsis-horizontal" onPress={onMore} label="More options" />
      </View>

      <View style={[s.meta, { bottom: bottomInset + 22 }]} pointerEvents="box-none">
        <View style={s.authorRow}>
          <Text style={s.handle}>@{author?.handle ?? 'someone'}</Text>
          <Text style={s.when}>· {timeAgo(short.createdAt, now)}</Text>
          {short.sample && (
            <View style={s.sample}>
              <Text style={s.sampleText}>Sample</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => setExpanded((e) => !e)} accessibilityLabel={expanded ? 'Show less' : 'Show more'}>
          <Text style={s.caption} numberOfLines={expanded ? 8 : 2}>
            {short.caption}
          </Text>
        </Pressable>
        {short.credit && <Text style={s.credit}>{short.credit}</Text>}
        <Pressable onPress={onToggleMute} style={s.sound} hitSlop={8} accessibilityLabel={muted ? 'Turn sound on' : 'Mute'}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={13} color="#fff" />
          <Text style={s.soundText}>{muted ? 'Tap for sound' : 'Original audio'}</Text>
        </Pressable>
      </View>

      <View style={[s.progressTrack, { bottom: bottomInset + 6 }]} pointerEvents="none">
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  item: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  pausedWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  paused: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },

  railCol: { position: 'absolute', right: 10, alignItems: 'center', gap: 16 },
  railAvatar: { marginBottom: 6 },
  follow: { position: 'absolute', bottom: -7, alignSelf: 'center', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.heart },
  rail: { alignItems: 'center', gap: 2, minWidth: 48 },
  railShadow: { textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  railCount: { fontFamily: font, color: '#fff', fontSize: 12, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 },

  meta: { position: 'absolute', left: 16, right: 84, gap: 6 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handle: { fontFamily: font, color: '#fff', fontSize: 15, fontWeight: '800' },
  when: { fontFamily: font, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  sample: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)' },
  sampleText: { fontFamily: font, color: '#fff', fontSize: 10, fontWeight: '800' },
  caption: { fontFamily: font, color: '#fff', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  credit: { fontFamily: font, color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600' },
  sound: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)' },
  soundText: { fontFamily: font, color: '#fff', fontSize: 12, fontWeight: '700' },

  progressTrack: { position: 'absolute', left: 16, right: 16, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  progressFill: { height: 2, backgroundColor: '#fff' },
});
