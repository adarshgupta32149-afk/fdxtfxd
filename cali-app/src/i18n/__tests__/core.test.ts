import { describe, expect, it } from 'vitest';

import { interpolate, matchLanguage, translate } from '../core';
import { LANGUAGES } from '../languages';

const en = { hello: 'Hello, {name}', 'sets_one': '{count} set', 'sets_other': '{count} sets', onlyEn: 'English only' };

describe('translate', () => {
  it('uses the language, then English, then the key', () => {
    expect(translate('hello', 'hi', { hello: 'नमस्ते, {name}' }, en, { name: 'Rohan' })).toBe('नमस्ते, Rohan');
    expect(translate('onlyEn', 'hi', {}, en)).toBe('English only');
    expect(translate('missing.key', 'hi', {}, en)).toBe('missing.key');
  });

  it('picks plural forms with each language’s own rules', () => {
    expect(translate('sets', 'en', en, en, { count: 1 })).toBe('1 set');
    expect(translate('sets', 'en', en, en, { count: 3 })).toBe('3 sets');
    const ru = { sets_one: '{count} подход', sets_few: '{count} подхода', sets_many: '{count} подходов', sets_other: '{count} подхода' };
    expect(translate('sets', 'ru', ru, en, { count: 1 })).toBe('1 подход');
    expect(translate('sets', 'ru', ru, en, { count: 3 })).toBe('3 подхода');
    expect(translate('sets', 'ru', ru, en, { count: 5 })).toBe('5 подходов');
    // Japanese has one form; falls back to _other.
    expect(translate('sets', 'ja', { sets_other: '{count}セット' }, en, { count: 1 })).toBe('1セット');
  });

  it('leaves unknown placeholders alone', () => {
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});

describe('matchLanguage', () => {
  it('maps device tags to offered languages', () => {
    expect(matchLanguage('hi-IN')).toBe('hi');
    expect(matchLanguage('es-MX')).toBe('es-419');
    expect(matchLanguage('es-ES')).toBe('es-ES');
    expect(matchLanguage('pt')).toBe('pt-BR');
    expect(matchLanguage('pt-PT')).toBe('pt-PT');
    expect(matchLanguage('zh-Hans-CN')).toBe('zh-CN');
    expect(matchLanguage('zh-Hant-TW')).toBe('zh-TW');
    expect(matchLanguage('zh-HK')).toBe('zh-HK');
    expect(matchLanguage('nn-NO')).toBe('nb');
    expect(matchLanguage('tl')).toBe('fil');
    expect(matchLanguage('xx')).toBeNull();
    expect(matchLanguage(null)).toBeNull();
  });

  it('offers 45 languages with unique codes, English first', () => {
    expect(LANGUAGES).toHaveLength(45);
    expect(new Set(LANGUAGES.map((l) => l.code)).size).toBe(45);
    expect(LANGUAGES[0].code).toBe('en');
    expect(LANGUAGES.filter((l) => l.rtl).map((l) => l.code)).toEqual(['ar', 'he']);
  });
});
