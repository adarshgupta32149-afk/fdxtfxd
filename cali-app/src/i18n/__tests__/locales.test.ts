import { describe, expect, it } from 'vitest';

import { translate } from '../core';
import { en } from '../en';
import { LANGUAGES } from '../languages';
import { LOCALES } from '../locales';

const PLURAL = /_(zero|one|two|few|many|other)$/;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const base = (key: string) => key.replace(PLURAL, '');
const translated = LANGUAGES.filter((l) => l.code !== 'en');

describe('locales', () => {
  it('ships a dictionary for every offered language, and nothing else', () => {
    expect(Object.keys(LOCALES).sort()).toEqual(translated.map((l) => l.code).sort());
  });

  it.each(translated.map((l) => l.code))('%s translates every English string', (code) => {
    const dict = LOCALES[code];
    const missing = Object.keys(en).filter((key) => {
      if (key in dict) return false;
      // A language with fewer plural forms than English may only carry key_other.
      return !(PLURAL.test(key) && `${base(key)}_other` in dict);
    });
    expect(missing).toEqual([]);
  });

  it.each(translated.map((l) => l.code))('%s keeps the same placeholders as English', (code) => {
    const dict = LOCALES[code];
    const wrong = Object.entries(dict).filter(([key, text]) => {
      const source = en[key] ?? en[`${base(key)}_other`];
      return source === undefined || placeholders(text).join() !== placeholders(source).join();
    });
    expect(wrong.map(([key]) => key)).toEqual([]);
  });

  it('marks only Arabic and Hebrew as right-to-left', () => {
    expect(LANGUAGES.filter((l) => l.rtl).map((l) => l.code).sort()).toEqual(['ar', 'he']);
  });

  it('uses each language’s own plural forms', () => {
    const t = (code: string, count: number) => translate('count.exercises', code, LOCALES[code], en, { count });
    expect(t('ru', 1)).toBe('1 упражнение');
    expect(t('ru', 3)).toBe('3 упражнения');
    expect(t('ru', 5)).toBe('5 упражнений');
    expect(t('pl', 22)).toBe('22 ćwiczenia');
    expect(t('ar', 2)).toBe('2 تمرينان');
    expect(t('ar', 11)).toBe('11 تمرينًا');
    expect(t('ro', 25)).toBe('25 de exerciții');
    expect(t('ja', 1)).toBe('1種目');
  });
});
