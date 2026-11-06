import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { newId } from '@/lib/state';
import { ME, parseSocial, sampleSocial, socialReducer, withMe, type FeedPost, type MediaRef, type Short, type SocialAction, type SocialState, type SpaceId } from '@/lib/social';
import { useAppState } from '@/state/AppStateProvider';

const STORAGE_KEY = 'cali.social.v1';

type Target = { kind: 'short' | 'post'; id: string };

interface SocialContextValue {
  social: SocialState;
  toggleLike: (t: Target) => void;
  like: (t: Target) => void;
  toggleSave: (t: Target) => void;
  share: (t: Target) => void;
  comment: (t: Target, text: string) => void;
  likeComment: (t: Target, commentId: string) => void;
  postShort: (input: { video: MediaRef; durationSec: number; caption: string }) => string;
  postToFeed: (input: { space: SpaceId; text: string; image?: MediaRef; aspect?: number }) => string;
  remove: (t: Target) => void;
  send: (conversationId: string, message: { text?: string; shared?: Target }) => void;
  /** Opens (or finds) a chat with someone and returns its id. */
  chatWith: (personId: string) => string;
  markRead: (conversationId: string) => void;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function useSocial(): SocialContextValue {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used inside SocialProvider');
  return ctx;
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const { state: app } = useAppState();
  const [raw, dispatch] = useReducer(socialReducer, undefined, () => sampleSocial(new Date()));
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .catch(() => null)
      .then((json) => {
        let parsed: unknown = null;
        try {
          parsed = json ? JSON.parse(json) : null;
        } catch {
          parsed = null;
        }
        loaded.current = true;
        dispatch({ type: 'reset', state: parseSocial(parsed, sampleSocial(new Date())) });
      });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(raw)).catch(() => {});
  }, [raw]);

  // The user's own profile always reflects their current display name.
  const social = useMemo(() => withMe(raw, app.profile.displayName), [raw, app.profile.displayName]);
  const socialRef = useRef(social);
  useEffect(() => {
    socialRef.current = social;
  }, [social]);

  const d = useCallback((a: SocialAction) => dispatch(a), []);

  const chatWith = useCallback(
    (personId: string) => {
      const existing = socialRef.current.conversations.find((c) => c.withId === personId);
      if (existing) return existing.id;
      const id = `cv-${newId()}`;
      d({ type: 'startConversation', conversation: { id, withId: personId, messages: [], unread: 0 } });
      return id;
    },
    [d],
  );

  const value = useMemo<SocialContextValue>(
    () => ({
      social,
      toggleLike: (target) => d({ type: 'toggleLike', target }),
      like: (target) => d({ type: 'like', target }),
      toggleSave: (target) => d({ type: 'toggleSave', target }),
      share: (target) => d({ type: 'share', target }),
      comment: (target, text) => d({ type: 'comment', target, text, id: newId(), at: new Date().toISOString() }),
      likeComment: (target, commentId) => d({ type: 'likeComment', target, commentId }),
      postShort: ({ video, durationSec, caption }) => {
        const short: Short = {
          id: `sh-${newId()}`,
          authorId: ME,
          video,
          durationSec,
          caption: caption.trim().slice(0, 300),
          createdAt: new Date().toISOString(),
          likes: 0,
          liked: false,
          saved: false,
          shares: 0,
          comments: [],
        };
        d({ type: 'addShort', short });
        return short.id;
      },
      postToFeed: ({ space, text, image, aspect }) => {
        const post: FeedPost = {
          id: `po-${newId()}`,
          authorId: ME,
          space,
          text: text.trim().slice(0, 2000),
          image,
          aspect,
          createdAt: new Date().toISOString(),
          likes: 0,
          liked: false,
          saved: false,
          shares: 0,
          comments: [],
        };
        d({ type: 'addPost', post });
        return post.id;
      },
      remove: (target) => d({ type: 'remove', target }),
      send: (conversationId, { text, shared }) => {
        const t = text?.trim();
        if (!t && !shared) return;
        d({ type: 'send', conversationId, message: { id: newId(), fromMe: true, text: t || undefined, shared, createdAt: new Date().toISOString() } });
      },
      chatWith,
      markRead: (conversationId) => d({ type: 'markRead', conversationId }),
    }),
    [social, d, chatWith],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
