'use client';

// TEC Life — i18n. Twelve languages, driven by ONE list (`LOCALES`), so the
// picker and the dictionaries cannot disagree about what is supported.
//
// It was two: `en` and `ar`, on the most personal app on the platform — the one
// where people write their own goals, in their own words. Ten of the twelve
// communities the rest of the fleet serves got an English interface here.
import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { LOCALES, DEFAULT_LOCALE, isLocale, dirOf, type Locale } from './locales';
import { DICTIONARIES, type Dictionary } from './dictionaries';

export { LOCALES, type Locale };

interface LocaleContextValue {
  locale:    Locale;
  setLocale: (locale: Locale) => void;
  t:         Dictionary;
  dir:       'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
const STORAGE_KEY = 'tec_locale';

/**
 * Put the language on the document, not just in React state.
 *
 * `dir` is what makes an Arabic layout right-to-left, and `lang` is what tells
 * the browser which font to reach for — a Hindi or Korean string rendered with
 * a Latin fallback is legible-ish and wrong. Neither is something a component
 * can set for itself.
 */
function applyDocument(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('dir', dirOf(locale));
  document.documentElement.setAttribute('lang', locale);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // The default, not the stored value, on the FIRST render: the server has no
  // localStorage, so reading it here would make the markup depend on something
  // only the browser knows.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isLocale(saved)) { setLocaleState(saved); applyDocument(saved); return; }
    } catch { /* private mode, or storage disabled — fall through */ }
    // Nothing stored: offer the phone's own language if we speak it. Someone
    // arriving from a Pi community should not have to find the picker first.
    try {
      const nav = navigator.language?.slice(0, 2).toLowerCase();
      if (nav && isLocale(nav)) { setLocaleState(nav); applyDocument(nav); }
    } catch { /* ignore */ }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyDocument(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: DICTIONARIES[locale], dir: dirOf(locale) }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  // Fail to ENGLISH, not to a crash: a component rendered outside the provider
  // (a test, a stray import) should show words, not throw.
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: DICTIONARIES[DEFAULT_LOCALE],
      dir: 'ltr',
    };
  }
  return ctx;
}
