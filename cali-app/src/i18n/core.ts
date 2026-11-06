/** Pure translation helpers: lookup with English fallback, {placeholders}, plurals, device matching. */
import { DEFAULT_LANGUAGE, LANGUAGES } from './languages';

export type Dict = Record<string, string>;
export type Vars = Record<string, string | number>;

/** Replaces {name} placeholders. Unknown placeholders are left as they are. */
export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] !== undefined ? String(vars[k]) : m));
}

const ruleCache = new Map<string, Intl.PluralRules | null>();
function pluralRule(lang: string, n: number): string {
  if (!ruleCache.has(lang)) {
    try {
      ruleCache.set(lang, new Intl.PluralRules(lang));
    } catch {
      ruleCache.set(lang, null);
    }
  }
  const r = ruleCache.get(lang);
  return r ? r.select(n) : n === 1 ? 'one' : 'other';
}

/**
 * Finds the text for a key. With a numeric `count`, tries key_<plural form> first (one, few,
 * many, two, zero, other), then key_other, then the key itself. Falls back to English, then
 * to the key, so a missing translation never shows an empty label.
 */
export function translate(key: string, lang: string, dict: Dict, en: Dict, vars?: Vars): string {
  const count = typeof vars?.count === 'number' ? vars.count : null;
  const candidates = count === null ? [key] : [`${key}_${pluralRule(lang, count)}`, `${key}_other`, key];
  for (const k of candidates) if (dict[k] !== undefined) return interpolate(dict[k], vars);
  const enCandidates = count === null ? [key] : [`${key}_${pluralRule('en', count)}`, `${key}_other`, key];
  for (const k of enCandidates) if (en[k] !== undefined) return interpolate(en[k], vars);
  return key;
}

/** Maps a device language tag (e.g. "es-MX", "zh-Hant-HK", "pt") to the closest language we offer. */
export function matchLanguage(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const t = tag.replace('_', '-');
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === t.toLowerCase());
  if (exact) return exact.code;
  const [base, ...rest] = t.toLowerCase().split('-');
  const region = rest.at(-1) ?? '';
  if (base === 'zh') {
    if (rest.includes('hant') || ['tw', 'mo'].includes(region)) return region === 'hk' || region === 'mo' ? 'zh-HK' : 'zh-TW';
    if (region === 'hk') return 'zh-HK';
    return 'zh-CN';
  }
  if (base === 'es') return region === 'es' ? 'es-ES' : 'es-419';
  if (base === 'pt') return region === 'pt' ? 'pt-PT' : 'pt-BR';
  const aliases: Record<string, string> = { no: 'nb', nn: 'nb', tl: 'fil', iw: 'he', in: 'id' };
  const b = aliases[base] ?? base;
  return LANGUAGES.find((l) => l.code === b)?.code ?? null;
}

export const isDefault = (code: string) => code === DEFAULT_LANGUAGE;
