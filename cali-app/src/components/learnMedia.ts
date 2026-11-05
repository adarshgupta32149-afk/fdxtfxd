import type { ImageSourcePropType } from 'react-native';

// Generated from assets/learn. Metro needs a static require for every image, so add new ones here.

const ARTICLE_IMAGES: Record<string, ImageSourcePropType> = {
  'beginner-plan': require('../../assets/learn/beginner-plan.jpg'),
  'front-lever': require('../../assets/learn/front-lever.jpg'),
  'front-lever-wiki': require('../../assets/learn/front-lever-wiki.jpg'),
  'hero-street': require('../../assets/learn/hero-street.jpg'),
  'hs-fall-less': require('../../assets/learn/hs-fall-less.jpg'),
  'hs-freestanding': require('../../assets/learn/hs-freestanding.jpg'),
  'lsit-barbend': require('../../assets/learn/lsit-barbend.jpg'),
  'lsit-fv': require('../../assets/learn/lsit-fv.jpg'),
  'muscle-up-steps': require('../../assets/learn/muscle-up-steps.jpg'),
  'pistol-barbend': require('../../assets/learn/pistol-barbend.jpg'),
  'pistol-bm': require('../../assets/learn/pistol-bm.jpg'),
  'planche': require('../../assets/learn/planche.jpg'),
  'protein': require('../../assets/learn/protein.jpg'),
  'pull-cavaliere': require('../../assets/learn/pull-cavaliere.jpg'),
  'pull-progression': require('../../assets/learn/pull-progression.jpg'),
  'sleep': require('../../assets/learn/sleep.jpg'),
  'sleep-study': require('../../assets/learn/sleep-study.jpg'),
  'wrist-prep': require('../../assets/learn/wrist-prep.jpg'),
  'wrist-stretches': require('../../assets/learn/wrist-stretches.jpg'),
};

const VIDEO_THUMBS: Record<string, ImageSourcePropType> = {
  '0r9uswEQwlY': require('../../assets/learn/yt/0r9uswEQwlY.jpg'),
  '1mlN0yuxoLE': require('../../assets/learn/yt/1mlN0yuxoLE.jpg'),
  '1xeSCokUsSI': require('../../assets/learn/yt/1xeSCokUsSI.jpg'),
  '5OWbZ9Oxz0E': require('../../assets/learn/yt/5OWbZ9Oxz0E.jpg'),
  '5g8_sj_8snc': require('../../assets/learn/yt/5g8_sj_8snc.jpg'),
  'AGhb8V8M758': require('../../assets/learn/yt/AGhb8V8M758.jpg'),
  'BeGUXwZmATQ': require('../../assets/learn/yt/BeGUXwZmATQ.jpg'),
  'D0omyxhQmbc': require('../../assets/learn/yt/D0omyxhQmbc.jpg'),
  'HxDP7SqggpI': require('../../assets/learn/yt/HxDP7SqggpI.jpg'),
  'QezdZIqmd1k': require('../../assets/learn/yt/QezdZIqmd1k.jpg'),
  'Qv6j5gZyBQ8': require('../../assets/learn/yt/Qv6j5gZyBQ8.jpg'),
  'T6JFMq3BRPY': require('../../assets/learn/yt/T6JFMq3BRPY.jpg'),
  'UZ_1jwG7aQ4': require('../../assets/learn/yt/UZ_1jwG7aQ4.jpg'),
  '__W7pVSWIpM': require('../../assets/learn/yt/__W7pVSWIpM.jpg'),
  '_eQ2gw_Gg5Y': require('../../assets/learn/yt/_eQ2gw_Gg5Y.jpg'),
  'aXDxa79u0xQ': require('../../assets/learn/yt/aXDxa79u0xQ.jpg'),
  'd7SLe_ubwy4': require('../../assets/learn/yt/d7SLe_ubwy4.jpg'),
  'edcbXUVH8_A': require('../../assets/learn/yt/edcbXUVH8_A.jpg'),
  'ffn__fZORBE': require('../../assets/learn/yt/ffn__fZORBE.jpg'),
  'geUKI_2uWaY': require('../../assets/learn/yt/geUKI_2uWaY.jpg'),
  'lbEl3yg4YWA': require('../../assets/learn/yt/lbEl3yg4YWA.jpg'),
  'lbXrBCxHA1s': require('../../assets/learn/yt/lbXrBCxHA1s.jpg'),
  'ojAabVC9an8': require('../../assets/learn/yt/ojAabVC9an8.jpg'),
  'pz6TbZ3lNV8': require('../../assets/learn/yt/pz6TbZ3lNV8.jpg'),
  'vq5_vdgJc0I': require('../../assets/learn/yt/vq5_vdgJc0I.jpg'),
  'x3NPAxiMRPw': require('../../assets/learn/yt/x3NPAxiMRPw.jpg'),
};

export const articleImage = (id: string) => ARTICLE_IMAGES[id];
// Video ids may contain '-', which the file names swap for '_'.
export const videoThumb = (id: string) => VIDEO_THUMBS[id.replace(/-/g, '_')];
export const heroImage = ARTICLE_IMAGES['hero-street'];
