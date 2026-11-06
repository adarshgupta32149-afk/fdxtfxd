import { describe, expect, it } from 'vitest';

import { checkShortDuration, formatDuration, ME, parseSocial, sampleSocial, shortCount, socialReducer, timeAgo, totalUnread, withMe, type SocialState } from '../social';

const now = new Date('2026-11-06T12:00:00Z');
const base = (): SocialState => sampleSocial(now);
const short = { kind: 'short' as const, id: 'sh-handstand' };
const post = { kind: 'post' as const, id: 'po-first-pullup' };

describe('3-minute limit', () => {
  it('accepts up to exactly 3:00 and reports seconds', () => {
    expect(checkShortDuration(180_000)).toEqual({ ok: true, seconds: 180 });
    expect(checkShortDuration(9_400)).toEqual({ ok: true, seconds: 9 });
  });
  it('refuses longer videos with the length in the message', () => {
    const r = checkShortDuration(181_600);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('3:02');
  });
  it('refuses videos with no readable length', () => {
    expect(checkShortDuration(null).ok).toBe(false);
    expect(checkShortDuration(0).ok).toBe(false);
    expect(checkShortDuration(Number.NaN).ok).toBe(false);
  });
});

describe('likes, saves, shares', () => {
  it('toggles a like and keeps the count in step', () => {
    const s0 = base();
    const before = s0.shorts[0].likes;
    const s1 = socialReducer(s0, { type: 'toggleLike', target: short });
    expect(s1.shorts[0]).toMatchObject({ liked: true, likes: before + 1 });
    const s2 = socialReducer(s1, { type: 'toggleLike', target: short });
    expect(s2.shorts[0]).toMatchObject({ liked: false, likes: before });
  });
  it('double-tap only ever likes', () => {
    const s1 = socialReducer(base(), { type: 'like', target: post });
    const s2 = socialReducer(s1, { type: 'like', target: post });
    expect(s2.posts[0].likes).toBe(s1.posts[0].likes);
    expect(s2.posts[0].liked).toBe(true);
  });
  it('saves and counts shares without touching other items', () => {
    const s0 = base();
    const s1 = socialReducer(socialReducer(s0, { type: 'toggleSave', target: post }), { type: 'share', target: post });
    expect(s1.posts[0]).toMatchObject({ saved: true, shares: s0.posts[0].shares + 1 });
    expect(s1.posts[1]).toBe(s0.posts[1]);
  });
});

describe('comments', () => {
  it('adds a trimmed comment from me and ignores empty ones', () => {
    const s1 = socialReducer(base(), { type: 'comment', target: short, text: '  clean line!  ', id: 'x1', at: now.toISOString() });
    const last = s1.shorts[0].comments.at(-1)!;
    expect(last).toMatchObject({ id: 'x1', authorId: ME, text: 'clean line!' });
    const s2 = socialReducer(s1, { type: 'comment', target: short, text: '   ', id: 'x2', at: now.toISOString() });
    expect(s2).toBe(s1);
  });
  it('likes a comment', () => {
    const s1 = socialReducer(base(), { type: 'likeComment', target: short, commentId: 'c1' });
    expect(s1.shorts[0].comments[0]).toMatchObject({ liked: true, likes: 13 });
  });
});

describe('posting and deleting', () => {
  it('puts new posts on top and only lets me delete my own', () => {
    const s0 = base();
    const mine = { ...s0.posts[0], id: 'mine', authorId: ME };
    const s1 = socialReducer(s0, { type: 'addPost', post: mine });
    expect(s1.posts[0].id).toBe('mine');
    const s2 = socialReducer(s1, { type: 'remove', target: { kind: 'post', id: 'mine' } });
    expect(s2.posts.find((p) => p.id === 'mine')).toBeUndefined();
    const s3 = socialReducer(s2, { type: 'remove', target: post });
    expect(s3.posts.find((p) => p.id === post.id)).toBeDefined();
  });
});

describe('messages', () => {
  it('sends, moves the chat to the top and clears unread', () => {
    const s0 = base();
    expect(totalUnread(s0)).toBe(3);
    const s1 = socialReducer(s0, { type: 'send', conversationId: 'cv-kabir', message: { id: 'z', fromMe: true, text: 'yo', createdAt: now.toISOString() } });
    expect(s1.conversations[0].id).toBe('cv-kabir');
    expect(s1.conversations[0].messages.at(-1)?.text).toBe('yo');
    const s2 = socialReducer(s1, { type: 'markRead', conversationId: 'cv-aarav' });
    expect(totalUnread(s2)).toBe(1);
  });
  it('does not open a second chat with the same person', () => {
    const s0 = base();
    const s1 = socialReducer(s0, { type: 'startConversation', conversation: { id: 'dup', withId: 'p-aarav', messages: [], unread: 0 } });
    expect(s1).toBe(s0);
  });
});

describe('formatting and loading', () => {
  it('formats durations, counts and ages', () => {
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(180)).toBe('3:00');
    expect(shortCount(5420)).toBe('5.4K');
    expect(shortCount(1000)).toBe('1K');
    expect(shortCount(2_500_000)).toBe('2.5M');
    expect(timeAgo('2026-11-06T11:59:30Z', now)).toBe('now');
    expect(timeAgo('2026-11-06T11:15:00Z', now)).toBe('45m');
    expect(timeAgo('2026-11-06T02:00:00Z', now)).toBe('10h');
    expect(timeAgo('2026-11-03T12:00:00Z', now)).toBe('3d');
  });
  it('adds me to the people list with a handle from my name', () => {
    const s = withMe(base(), 'Rohan Singh');
    expect(s.people[0]).toMatchObject({ id: ME, name: 'Rohan Singh', handle: 'rohan.singh' });
    expect(withMe(s, '').people[0].handle).toBe('you');
  });
  it('falls back to starter content on bad data and drops dead web uploads', () => {
    const fb = base();
    expect(parseSocial(null, fb)).toBe(fb);
    expect(parseSocial({ version: 2 }, fb)).toBe(fb);
    const saved = { ...fb, shorts: [{ ...fb.shorts[0], id: 'blob', video: { kind: 'uri', uri: 'blob:http://x/1' } }, ...fb.shorts] };
    expect(parseSocial(saved, fb).shorts.find((x) => x.id === 'blob')).toBeUndefined();
  });
});
