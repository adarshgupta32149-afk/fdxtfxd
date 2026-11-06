/**
 * The languages Cali offers: the locales Meta lists for Messenger (Android and web), so the
 * set matches what people already see in Facebook, Instagram and WhatsApp. English is the
 * default and the fallback for anything not yet translated.
 * Source: developers.facebook.com/docs/messenger-platform/messenger-profile/supported-locales
 */
export interface Language {
  /** BCP 47 tag, also used for dates and numbers. */
  code: string;
  /** Name in English, for search. */
  english: string;
  /** Name in the language itself, shown in the picker. */
  native: string;
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: 'en', english: 'English', native: 'English' },
  { code: 'af', english: 'Afrikaans', native: 'Afrikaans' },
  { code: 'ar', english: 'Arabic', native: 'العربية', rtl: true },
  { code: 'bn', english: 'Bengali', native: 'বাংলা' },
  { code: 'cs', english: 'Czech', native: 'Čeština' },
  { code: 'da', english: 'Danish', native: 'Dansk' },
  { code: 'de', english: 'German', native: 'Deutsch' },
  { code: 'el', english: 'Greek', native: 'Ελληνικά' },
  { code: 'es-ES', english: 'Spanish (Spain)', native: 'Español (España)' },
  { code: 'es-419', english: 'Spanish (Latin America)', native: 'Español (Latinoamérica)' },
  { code: 'fi', english: 'Finnish', native: 'Suomi' },
  { code: 'fil', english: 'Filipino', native: 'Filipino' },
  { code: 'fr', english: 'French', native: 'Français' },
  { code: 'gu', english: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'he', english: 'Hebrew', native: 'עברית', rtl: true },
  { code: 'hi', english: 'Hindi', native: 'हिन्दी' },
  { code: 'hr', english: 'Croatian', native: 'Hrvatski' },
  { code: 'hu', english: 'Hungarian', native: 'Magyar' },
  { code: 'id', english: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'it', english: 'Italian', native: 'Italiano' },
  { code: 'ja', english: 'Japanese', native: '日本語' },
  { code: 'kn', english: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ko', english: 'Korean', native: '한국어' },
  { code: 'ml', english: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', english: 'Marathi', native: 'मराठी' },
  { code: 'ms', english: 'Malay', native: 'Bahasa Melayu' },
  { code: 'nb', english: 'Norwegian (Bokmål)', native: 'Norsk bokmål' },
  { code: 'nl', english: 'Dutch', native: 'Nederlands' },
  { code: 'pa', english: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'pl', english: 'Polish', native: 'Polski' },
  { code: 'pt-BR', english: 'Portuguese (Brazil)', native: 'Português (Brasil)' },
  { code: 'pt-PT', english: 'Portuguese (Portugal)', native: 'Português (Portugal)' },
  { code: 'ro', english: 'Romanian', native: 'Română' },
  { code: 'ru', english: 'Russian', native: 'Русский' },
  { code: 'sk', english: 'Slovak', native: 'Slovenčina' },
  { code: 'sv', english: 'Swedish', native: 'Svenska' },
  { code: 'ta', english: 'Tamil', native: 'தமிழ்' },
  { code: 'te', english: 'Telugu', native: 'తెలుగు' },
  { code: 'th', english: 'Thai', native: 'ไทย' },
  { code: 'tr', english: 'Turkish', native: 'Türkçe' },
  { code: 'uk', english: 'Ukrainian', native: 'Українська' },
  { code: 'vi', english: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'zh-CN', english: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'zh-HK', english: 'Chinese (Traditional, Hong Kong)', native: '繁體中文（香港）' },
  { code: 'zh-TW', english: 'Chinese (Traditional, Taiwan)', native: '繁體中文（台灣）' },
];

export const DEFAULT_LANGUAGE = 'en';
export const languageByCode = (code: string) => LANGUAGES.find((l) => l.code === code);

/** Scripts with tall marks above and below the line (Indic, Thai, Arabic, Hebrew) need looser line height in big headings. */
const TALL = new Set(['hi', 'mr', 'bn', 'gu', 'pa', 'ta', 'te', 'kn', 'ml', 'th', 'ar', 'he']);
export const needsTallLines = (code: string) => TALL.has(code);

/** Line height for a heading: the Latin value, or 1.35× the font size for tall scripts. */
export const headingLineHeight = (code: string, fontSize: number, latin: number) => (TALL.has(code) ? Math.round(fontSize * 1.35) : latin);
