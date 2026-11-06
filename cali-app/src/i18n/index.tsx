import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

import { translate, type Dict, type Vars } from './core';
import { en, type Key } from './en';
import { DEFAULT_LANGUAGE, languageByCode } from './languages';
import { LOCALES } from './locales';

const STORAGE_KEY = 'cali.lang';

interface I18nValue {
  /** BCP 47 code of the current language; use it for dates and numbers too. */
  lang: string;
  t: (key: Key, vars?: Vars) => string;
  setLanguage: (code: string) => void;
  /** True on a phone after switching between left-to-right and right-to-left: the layout flips on restart. */
  needsRestart: boolean;
}

const I18nContext = createContext<I18nValue>({
  lang: DEFAULT_LANGUAGE,
  t: (key, vars) => translate(key, DEFAULT_LANGUAGE, en, en, vars),
  setLanguage: () => {},
  needsRestart: false,
});

export const useT = () => useContext(I18nContext);

function applyDirection(code: string): boolean {
  const rtl = !!languageByCode(code)?.rtl;
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = code;
    }
    return false;
  }
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return true;
}

/** English by default, like most apps; people pick another language in Settings. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const [needsRestart, setNeedsRestart] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && languageByCode(saved)) {
          setLang(saved);
          applyDirection(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((code: string) => {
    if (!languageByCode(code)) return;
    setLang(code);
    if (applyDirection(code)) setNeedsRestart(true);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict: Dict = lang === DEFAULT_LANGUAGE ? en : (LOCALES[lang] ?? {});
    return { lang, t: (key, vars) => translate(key, lang, dict, en, vars), setLanguage, needsRestart };
  }, [lang, setLanguage, needsRestart]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
