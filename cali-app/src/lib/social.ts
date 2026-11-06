/**
 * The social side of Cali: Shorts (vertical videos up to 3 minutes), the Feed (photo and text
 * posts in topic spaces) and Messages. Plain data and a reducer, so it can be tested without
 * React and later synced to a backend without changing the screens.
 */

/** Uploads longer than this are refused. */
export const MAX_SHORT_SEC = 180;

/** Where a picture or video comes from: bundled with the app, or picked from the phone. */
export type MediaRef = { kind: 'asset'; key: string } | { kind: 'uri'; uri: string };

export interface Person {
  id: string;
  name: string;
  handle: string;
  /** Avatar background; the initial sits on top. */
  color: string;
  bio?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  likes: number;
  liked: boolean;
}

interface Engagement {
  likes: number;
  liked: boolean;
  saved: boolean;
  shares: number;
  comments: Comment[];
}

export interface Short extends Engagement {
  id: string;
  authorId: string;
  video: MediaRef;
  poster?: MediaRef;
  durationSec: number;
  caption: string;
  createdAt: string;
  /** Photo or footage credit, shown under the caption. */
  credit?: string;
  /** Starter content shipped with the app, labelled as such. */
  sample?: boolean;
}

export type SpaceId = 'progress' | 'form' | 'questions' | 'wins' | 'memes';

export const SPACES: { id: SpaceId; label: string; color: string; blurb: string }[] = [
  { id: 'progress', label: 'Progress', color: '#9EC2FF', blurb: 'Before and afters, week-by-week logs.' },
  { id: 'form', label: 'Form check', color: '#F2A7C3', blurb: 'Post a rep, get honest feedback.' },
  { id: 'questions', label: 'Questions', color: '#E3C77A', blurb: 'No question is too basic.' },
  { id: 'wins', label: 'Wins', color: '#FF9A62', blurb: 'First pull-up? Tell everyone.' },
  { id: 'memes', label: 'Memes', color: '#B9A4FF', blurb: 'Gym humour, keep it kind.' },
];

export interface FeedPost extends Engagement {
  id: string;
  authorId: string;
  space: SpaceId;
  image?: MediaRef;
  /** Aspect ratio of the image (width / height). */
  aspect?: number;
  text: string;
  createdAt: string;
  credit?: string;
  sample?: boolean;
}

export interface Message {
  id: string;
  fromMe: boolean;
  text?: string;
  /** A Short or post sent into the chat. */
  shared?: { kind: 'short' | 'post'; id: string };
  createdAt: string;
}

export interface Conversation {
  id: string;
  withId: string;
  messages: Message[];
  unread: number;
  sample?: boolean;
}

export interface SocialState {
  version: 1;
  people: Person[];
  shorts: Short[];
  posts: FeedPost[];
  conversations: Conversation[];
}

export const ME = 'me';

type Target = { kind: 'short' | 'post'; id: string };

export type SocialAction =
  | { type: 'toggleLike'; target: Target }
  | { type: 'like'; target: Target }
  | { type: 'toggleSave'; target: Target }
  | { type: 'share'; target: Target }
  | { type: 'comment'; target: Target; text: string; id: string; at: string }
  | { type: 'likeComment'; target: Target; commentId: string }
  | { type: 'addShort'; short: Short }
  | { type: 'addPost'; post: FeedPost }
  | { type: 'remove'; target: Target }
  | { type: 'send'; conversationId: string; message: Message }
  | { type: 'startConversation'; conversation: Conversation }
  | { type: 'markRead'; conversationId: string }
  | { type: 'reset'; state: SocialState };

function mapEngagement<T extends Engagement & { id: string }>(items: T[], id: string, fn: (x: T) => T): T[] {
  return items.map((x) => (x.id === id ? fn(x) : x));
}

function onTarget(state: SocialState, target: Target, fn: <T extends Engagement & { id: string }>(x: T) => T): SocialState {
  return target.kind === 'short'
    ? { ...state, shorts: mapEngagement(state.shorts, target.id, fn) }
    : { ...state, posts: mapEngagement(state.posts, target.id, fn) };
}

export function socialReducer(state: SocialState, action: SocialAction): SocialState {
  switch (action.type) {
    case 'toggleLike':
      return onTarget(state, action.target, (x) => ({ ...x, liked: !x.liked, likes: Math.max(0, x.likes + (x.liked ? -1 : 1)) }));
    case 'like':
      // Double-tap only ever likes; it never un-likes.
      return onTarget(state, action.target, (x) => (x.liked ? x : { ...x, liked: true, likes: x.likes + 1 }));
    case 'toggleSave':
      return onTarget(state, action.target, (x) => ({ ...x, saved: !x.saved }));
    case 'share':
      return onTarget(state, action.target, (x) => ({ ...x, shares: x.shares + 1 }));
    case 'comment': {
      const text = action.text.trim().slice(0, 500);
      if (!text) return state;
      const c: Comment = { id: action.id, authorId: ME, text, createdAt: action.at, likes: 0, liked: false };
      return onTarget(state, action.target, (x) => ({ ...x, comments: [...x.comments, c] }));
    }
    case 'likeComment':
      return onTarget(state, action.target, (x) => ({
        ...x,
        comments: x.comments.map((c) => (c.id === action.commentId ? { ...c, liked: !c.liked, likes: Math.max(0, c.likes + (c.liked ? -1 : 1)) } : c)),
      }));
    case 'addShort':
      return { ...state, shorts: [action.short, ...state.shorts] };
    case 'addPost':
      return { ...state, posts: [action.post, ...state.posts] };
    case 'remove':
      // People can only delete what they posted.
      return action.target.kind === 'short'
        ? { ...state, shorts: state.shorts.filter((x) => !(x.id === action.target.id && x.authorId === ME)) }
        : { ...state, posts: state.posts.filter((x) => !(x.id === action.target.id && x.authorId === ME)) };
    case 'send': {
      const exists = state.conversations.some((c) => c.id === action.conversationId);
      if (!exists) return state;
      const conversations = state.conversations.map((c) => (c.id === action.conversationId ? { ...c, messages: [...c.messages, action.message] } : c));
      // Most recent chat first.
      const moved = conversations.find((c) => c.id === action.conversationId)!;
      return { ...state, conversations: [moved, ...conversations.filter((c) => c.id !== action.conversationId)] };
    }
    case 'startConversation':
      if (state.conversations.some((c) => c.withId === action.conversation.withId)) return state;
      return { ...state, conversations: [action.conversation, ...state.conversations] };
    case 'markRead':
      return { ...state, conversations: state.conversations.map((c) => (c.id === action.conversationId ? { ...c, unread: 0 } : c)) };
    case 'reset':
      return action.state;
  }
}

/** Checks a picked video against the 3-minute limit. The picker reports milliseconds. */
export function checkShortDuration(durationMs: number | null | undefined): { ok: true; seconds: number } | { ok: false; reason: string } {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs <= 0) return { ok: false, reason: 'We could not read how long this video is. Try another one.' };
  const seconds = Math.round(durationMs / 1000);
  if (seconds > MAX_SHORT_SEC) return { ok: false, reason: `This video is ${formatDuration(seconds)}. Shorts can be up to 3:00, so trim it first.` };
  return { ok: true, seconds: Math.max(1, seconds) };
}

/** 75 → "1:15". */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** How long ago, as a unit and a number, so each language can word it. */
export function agoParts(iso: string, now: Date): { unit: 'now' | 'm' | 'h' | 'd' | 'w' | 'date'; n: number } {
  const sec = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return { unit: 'now', n: 0 };
  if (sec < 3600) return { unit: 'm', n: Math.floor(sec / 60) };
  if (sec < 86400) return { unit: 'h', n: Math.floor(sec / 3600) };
  if (sec < 86400 * 7) return { unit: 'd', n: Math.floor(sec / 86400) };
  if (sec < 86400 * 35) return { unit: 'w', n: Math.floor(sec / (86400 * 7)) };
  return { unit: 'date', n: 0 };
}

/** "now", "5m", "3h", "2d", "4w", then a date (English; screens use the translated useAgo). */
export function timeAgo(iso: string, now: Date, locale?: string): string {
  const { unit, n } = agoParts(iso, now);
  if (unit === 'now') return 'now';
  if (unit === 'date') return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${n}${unit}`;
}

/** 1234 → "1.2K", 5600000 → "5.6M". */
export function shortCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export const totalUnread = (s: SocialState) => s.conversations.reduce((n, c) => n + c.unread, 0);
export const personById = (s: SocialState, id: string): Person | undefined => s.people.find((p) => p.id === id);

/** Fills in the user's own profile so their posts and comments show their name. */
export function withMe(state: SocialState, name: string): SocialState {
  const display = name.trim() || 'You';
  const handle = display.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'you';
  const me: Person = { id: ME, name: display, handle, color: '#D9D9D9' };
  const others = state.people.filter((p) => p.id !== ME);
  return { ...state, people: [me, ...others] };
}

/** Keeps saved data safe to use: unknown or broken shapes fall back to the starter content. */
export function parseSocial(raw: unknown, fallback: SocialState): SocialState {
  if (!raw || typeof raw !== 'object') return fallback;
  const s = raw as Partial<SocialState>;
  if (s.version !== 1 || !Array.isArray(s.shorts) || !Array.isArray(s.posts) || !Array.isArray(s.conversations) || !Array.isArray(s.people)) return fallback;
  // Uploads picked on the web are temporary blob: links that die on reload; drop them.
  const alive = (m?: MediaRef) => !m || m.kind === 'asset' || !m.uri.startsWith('blob:');
  return {
    version: 1,
    people: s.people,
    shorts: s.shorts.filter((x) => alive(x.video)),
    posts: s.posts.filter((x) => alive(x.image)),
    conversations: s.conversations,
  };
}

// ---------------------------------------------------------------------------------------
// Starter content: sample creators and posts so the app is not empty before launch.
// Every item is marked `sample` and labelled in the UI. Photos are Wikimedia Commons
// (credited); the GLOWUP clip is Cali's own.

const ago = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

const c = (id: string, authorId: string, text: string, at: string, likes = 0): Comment => ({ id, authorId, text, createdAt: at, likes, liked: false });

export const SAMPLE_PEOPLE: Person[] = [
  { id: 'p-aarav', name: 'Aarav', handle: 'aarav.pulls', color: '#FFB38A', bio: 'Chasing the muscle-up. Day 41.' },
  { id: 'p-meera', name: 'Meera', handle: 'meera.inverts', color: '#F2A7C3', bio: 'Upside down most evenings.' },
  { id: 'p-kabir', name: 'Kabir', handle: 'kabir.bars', color: '#9EC2FF', bio: 'Park bars, sunrise sessions.' },
  { id: 'p-zoya', name: 'Zoya', handle: 'zoya.lsit', color: '#B9A4FF', bio: 'Compression is my personality.' },
  { id: 'p-dev', name: 'Dev', handle: 'dev.legday', color: '#E3C77A', bio: 'Pistols, not pistols.' },
  { id: 'p-glow', name: 'Glow-up 60', handle: 'glowup.60', color: '#FF9A62', bio: '60 days to change everything.' },
];

export function sampleSocial(now: Date): SocialState {
  return {
    version: 1,
    people: SAMPLE_PEOPLE,
    shorts: [
      {
        id: 'sh-handstand',
        authorId: 'p-meera',
        video: { kind: 'asset', key: 's_handstand' },
        poster: { kind: 'asset', key: 's_handstand_poster' },
        durationSec: 9,
        caption: 'Six weeks ago I could not leave the wall. Today: 8 seconds free. Wrist prep every single day, no skipping.',
        createdAt: ago(now, 95),
        likes: 1284,
        liked: false,
        saved: false,
        shares: 41,
        credit: 'Photo: Jacob Ekaineck, CC BY-SA 4.0',
        sample: true,
        comments: [
          c('c1', 'p-kabir', 'The line is so clean already', ago(now, 80), 12),
          c('c2', 'p-zoya', 'how many minutes a day are you practising?', ago(now, 70), 4),
          c('c3', 'p-meera', '@zoya.lsit 10 min, split into two blocks', ago(now, 66), 9),
        ],
      },
      {
        id: 'sh-glowup',
        authorId: 'p-glow',
        video: { kind: 'asset', key: 's_glowup' },
        poster: { kind: 'asset', key: 's_glowup_poster' },
        durationSec: 40,
        caption: 'Episode 1. 60 days to the wedding, 0% glow-up. Comment ONE word: gym or skin.',
        createdAt: ago(now, 240),
        likes: 5420,
        liked: false,
        saved: false,
        shares: 312,
        sample: true,
        comments: [
          c('c4', 'p-dev', 'GYM', ago(now, 230), 88),
          c('c5', 'p-aarav', 'gym obviously', ago(now, 220), 31),
          c('c6', 'p-meera', 'skin first, trust', ago(now, 200), 14),
        ],
      },
      {
        id: 'sh-pistol',
        authorId: 'p-dev',
        video: { kind: 'asset', key: 's_pistol' },
        poster: { kind: 'asset', key: 's_pistol_poster' },
        durationSec: 9,
        caption: 'Leg day, glacier edition. Box pistols got me here: went 2 cm lower every week.',
        createdAt: ago(now, 60 * 20),
        likes: 732,
        liked: false,
        saved: false,
        shares: 19,
        credit: 'Photo: FeldBum, CC BY-SA 4.0',
        sample: true,
        comments: [c('c7', 'p-kabir', 'the box trick works, did the same', ago(now, 60 * 19), 6)],
      },
      {
        id: 'sh-lsit',
        authorId: 'p-zoya',
        video: { kind: 'asset', key: 's_lsit' },
        poster: { kind: 'asset', key: 's_lsit_poster' },
        durationSec: 9,
        caption: 'L-sit went from 10 s to 20 s in a month. Tuck holds and toes-to-bar, three times a week.',
        createdAt: ago(now, 60 * 30),
        likes: 418,
        liked: false,
        saved: false,
        shares: 7,
        credit: 'Photo: Anthony Topper, CC BY 2.0',
        sample: true,
        comments: [],
      },
      {
        id: 'sh-park',
        authorId: 'p-kabir',
        video: { kind: 'asset', key: 's_park' },
        poster: { kind: 'asset', key: 's_park_poster' },
        durationSec: 9,
        caption: 'Sunday park session with the crew. Who is coming next week?',
        createdAt: ago(now, 60 * 48),
        likes: 296,
        liked: false,
        saved: false,
        shares: 12,
        credit: 'Photo: Marsilar, CC BY-SA 4.0',
        sample: true,
        comments: [c('c8', 'p-aarav', 'in. 7am?', ago(now, 60 * 47), 3)],
      },
    ],
    posts: [
      {
        id: 'po-first-pullup',
        authorId: 'p-aarav',
        space: 'wins',
        text: 'FIRST STRICT PULL-UP. 41 days of negatives and dead hangs. Chin over the bar, no kick. I nearly cried in the park.',
        createdAt: ago(now, 35),
        likes: 214,
        liked: false,
        saved: false,
        shares: 6,
        sample: true,
        comments: [
          c('c10', 'p-meera', 'LETS GOOO', ago(now, 30), 8),
          c('c11', 'p-kabir', 'next stop: 5 reps', ago(now, 28), 5),
        ],
      },
      {
        id: 'po-handstand-city',
        authorId: 'p-meera',
        space: 'progress',
        image: { kind: 'asset', key: 'hs-freestanding' },
        aspect: 16 / 10,
        text: 'Week 6 of handstand practice. Still banana-ing a little; working on ribs down.',
        createdAt: ago(now, 150),
        likes: 389,
        liked: false,
        saved: false,
        shares: 9,
        credit: 'Photo: Jacob Ekaineck, CC BY-SA 4.0',
        sample: true,
        comments: [c('c12', 'p-zoya', 'squeeze the glutes, it fixes half of it', ago(now, 140), 11)],
      },
      {
        id: 'po-question-grip',
        authorId: 'p-dev',
        space: 'questions',
        text: 'Grip gives out before my back on pull-ups. Should I train hangs separately or just do more sets?',
        createdAt: ago(now, 60 * 5),
        likes: 47,
        liked: false,
        saved: false,
        shares: 1,
        sample: true,
        comments: [
          c('c13', 'p-aarav', 'Separate hangs. 3 x 30 s at the end of every session fixed mine.', ago(now, 60 * 4), 14),
          c('c14', 'p-kabir', 'chalk helps more than you think', ago(now, 60 * 4 - 20), 6),
        ],
      },
      {
        id: 'po-lsit-form',
        authorId: 'p-zoya',
        space: 'form',
        image: { kind: 'asset', key: 'lsit-barbend' },
        aspect: 16 / 10,
        text: 'Form check: are my shoulders sinking here? Feels like I am hanging on the joints.',
        createdAt: ago(now, 60 * 9),
        likes: 62,
        liked: false,
        saved: false,
        shares: 2,
        credit: 'Photo: Anthony Topper, CC BY 2.0',
        sample: true,
        comments: [c('c15', 'p-meera', 'a little. push the floor away until your neck looks long', ago(now, 60 * 8), 9)],
      },
      {
        id: 'po-meme',
        authorId: 'p-kabir',
        space: 'memes',
        text: 'Me: one more set.\nAlso me, 40 minutes later, lying under the bar: one more set.',
        createdAt: ago(now, 60 * 14),
        likes: 902,
        liked: false,
        saved: false,
        shares: 64,
        sample: true,
        comments: [c('c16', 'p-dev', 'this is a personal attack', ago(now, 60 * 13), 40)],
      },
      {
        id: 'po-pistol',
        authorId: 'p-dev',
        space: 'progress',
        image: { kind: 'asset', key: 'pistol-bm' },
        aspect: 16 / 10,
        text: 'Down to the lowest box. Next week: no box.',
        createdAt: ago(now, 60 * 26),
        likes: 133,
        liked: false,
        saved: false,
        shares: 3,
        credit: 'Photo: Jgcastor, CC BY-SA 3.0',
        sample: true,
        comments: [],
      },
    ],
    conversations: [
      {
        id: 'cv-aarav',
        withId: 'p-aarav',
        unread: 2,
        sample: true,
        messages: [
          { id: 'm1', fromMe: false, text: 'bro you coming to the bars tomorrow?', createdAt: ago(now, 50) },
          { id: 'm2', fromMe: true, text: 'yes, 7am', createdAt: ago(now, 45) },
          { id: 'm3', fromMe: false, shared: { kind: 'short', id: 'sh-handstand' }, createdAt: ago(now, 12) },
          { id: 'm4', fromMe: false, text: 'we need to try this', createdAt: ago(now, 11) },
        ],
      },
      {
        id: 'cv-meera',
        withId: 'p-meera',
        unread: 1,
        sample: true,
        messages: [
          { id: 'm5', fromMe: true, text: 'how long did the wall phase take you?', createdAt: ago(now, 60 * 6) },
          { id: 'm6', fromMe: false, text: 'about a month to get 30 s, then the frog stand helped a lot', createdAt: ago(now, 60 * 3) },
        ],
      },
      {
        id: 'cv-kabir',
        withId: 'p-kabir',
        unread: 0,
        sample: true,
        messages: [
          { id: 'm7', fromMe: false, text: 'sunday session was fire', createdAt: ago(now, 60 * 40) },
          { id: 'm8', fromMe: true, text: 'next week same time', createdAt: ago(now, 60 * 39) },
        ],
      },
    ],
  };
}
