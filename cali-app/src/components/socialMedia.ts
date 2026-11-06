import type { ImageSourcePropType } from 'react-native';

import { articleImage } from '@/components/learnMedia';
import type { MediaRef } from '@/lib/social';

// Bundled starter clips and their posters. Metro needs a static require per file.
const VIDEOS: Record<string, number> = {
  s_glowup: require('../../assets/shorts/s_glowup.mp4'),
  s_handstand: require('../../assets/shorts/s_handstand.mp4'),
  s_lsit: require('../../assets/shorts/s_lsit.mp4'),
  s_park: require('../../assets/shorts/s_park.mp4'),
  s_pistol: require('../../assets/shorts/s_pistol.mp4'),
};

const POSTERS: Record<string, ImageSourcePropType> = {
  s_glowup_poster: require('../../assets/shorts/s_glowup_poster.jpg'),
  s_handstand_poster: require('../../assets/shorts/s_handstand_poster.jpg'),
  s_lsit_poster: require('../../assets/shorts/s_lsit_poster.jpg'),
  s_park_poster: require('../../assets/shorts/s_park_poster.jpg'),
  s_pistol_poster: require('../../assets/shorts/s_pistol_poster.jpg'),
};

/** A video source for expo-video: a bundled clip or a picked file. */
export function videoSource(ref: MediaRef): number | string | null {
  return ref.kind === 'asset' ? (VIDEOS[ref.key] ?? null) : ref.uri;
}

/** An image source: a bundled poster or Learn photo, or a picked file. */
export function imageSource(ref: MediaRef | undefined): ImageSourcePropType | undefined {
  if (!ref) return undefined;
  if (ref.kind === 'uri') return { uri: ref.uri };
  return POSTERS[ref.key] ?? articleImage(ref.key);
}
