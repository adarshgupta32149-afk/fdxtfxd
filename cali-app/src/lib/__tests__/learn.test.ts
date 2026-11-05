/// <reference types="node" />
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ARTICLES, CATEGORIES, compactCount, dailyPick, dayOfYear, forFocus, formatPublished, inCategory, relatedTo, VIDEOS, watchUrl } from '../learn';
import { SKILLS } from '../skills';

const assets = join(__dirname, '../../../assets/learn');
const skillIds = new Set(SKILLS.map((s) => s.id));

describe('learn library', () => {
  it('has unique ids', () => {
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length);
    expect(new Set(VIDEOS.map((v) => v.id)).size).toBe(VIDEOS.length);
  });

  it('has a cover image for every article and a thumbnail for every video', () => {
    for (const a of ARTICLES) expect(existsSync(join(assets, `${a.id}.jpg`)), a.id).toBe(true);
    for (const v of VIDEOS) expect(existsSync(join(assets, 'yt', `${v.id.replace(/-/g, '_')}.jpg`)), v.id).toBe(true);
  });

  it('links only to real skills and categories', () => {
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const x of [...ARTICLES, ...VIDEOS]) {
      expect(cats.has(x.category), x.id).toBe(true);
      if (x.skillId) expect(skillIds.has(x.skillId), x.id).toBe(true);
    }
  });

  it('gives every article a source link, a summary, takeaways and a Cali tip', () => {
    for (const a of ARTICLES) {
      expect(a.url).toMatch(/^https:\/\//);
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.takeaways.length).toBeGreaterThan(0);
      expect(a.caliTip.length).toBeGreaterThan(20);
      expect(a.minutes).toBeGreaterThan(0);
    }
  });

  it('covers every category with at least one article', () => {
    for (const c of CATEGORIES) expect(ARTICLES.some((a) => a.category === c.id), c.id).toBe(true);
  });
});

describe('learn helpers', () => {
  it('formats view counts', () => {
    expect(compactCount(3408381)).toBe('3.4M');
    expect(compactCount(21197476)).toBe('21M');
    expect(compactCount(880358)).toBe('880K');
    expect(compactCount(952)).toBe('952');
    expect(compactCount(2000000)).toBe('2M');
  });

  it('formats publish dates', () => {
    expect(formatPublished('2023-08-20')).toBe('Aug 2023');
    expect(formatPublished('2026-10')).toBe('Oct 2026');
    expect(formatPublished('2023')).toBe('2023');
  });

  it('builds watch links for videos and shorts', () => {
    expect(watchUrl({ ...VIDEOS[0], short: false })).toBe(`https://www.youtube.com/watch?v=${VIDEOS[0].id}`);
    expect(watchUrl({ ...VIDEOS[0], short: true })).toBe(`https://www.youtube.com/shorts/${VIDEOS[0].id}`);
  });

  it('filters by category', () => {
    expect(inCategory(ARTICLES, 'all')).toHaveLength(ARTICLES.length);
    expect(inCategory(ARTICLES, 'legs').every((a) => a.category === 'legs')).toBe(true);
  });

  it('puts focus skills first, in the order chosen, and keeps the rest stable', () => {
    const items = [
      { id: 'a', skillId: 'pistol' },
      { id: 'b', skillId: 'handstand' },
      { id: 'c' },
      { id: 'd', skillId: 'handstand' },
    ];
    expect(forFocus(items, ['handstand', 'pistol']).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(forFocus(items, []).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('finds related items on the same skill first, never the item itself', () => {
    const target = ARTICLES.find((a) => a.id === 'pistol-bm')!;
    const rel = relatedTo(ARTICLES, target, 5);
    expect(rel.map((a) => a.id)).not.toContain('pistol-bm');
    expect(rel[0].skillId).toBe('pistol');
    const vids = relatedTo(VIDEOS, target, 3);
    expect(vids.every((v) => v.skillId === 'pistol' || v.category === 'legs')).toBe(true);
  });
});

describe('daily pick', () => {
  it('counts days from 1 January in local time', () => {
    expect(dayOfYear(new Date(2026, 0, 1, 23, 59))).toBe(0);
    expect(dayOfYear(new Date(2026, 1, 1))).toBe(31);
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(364);
  });

  it('is stable within a day and changes the next day', () => {
    const a = dailyPick(ARTICLES, new Date(2026, 10, 5, 8));
    expect(dailyPick(ARTICLES, new Date(2026, 10, 5, 22))).toBe(a);
    expect(dailyPick(ARTICLES, new Date(2026, 10, 6, 8))).not.toBe(a);
  });

  it('stays on the focus skills when there are matches', () => {
    const items = [{ id: 'x' }, { id: 'p', skillId: 'pistol' }, { id: 'h', skillId: 'handstand' }];
    for (let d = 0; d < 10; d++) expect(dailyPick(items, new Date(2026, 0, 1 + d), ['pistol'])?.id).toBe('p');
    expect(dailyPick(ARTICLES, new Date(2026, 10, 5), ['muscle-up'])?.skillId).toBe('muscle-up');
  });

  it('falls back to everything without focus matches', () => {
    const items: { id: string; skillId?: string }[] = [{ id: 'x' }, { id: 'y' }];
    expect(dailyPick(items, new Date(2026, 0, 1), ['planche'])?.id).toBe('x');
    expect(dailyPick(items, new Date(2026, 0, 2))?.id).toBe('y');
    expect(dailyPick([], new Date())).toBeUndefined();
  });
});
