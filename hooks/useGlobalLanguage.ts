import { useCallback, useEffect, useState } from 'react';
import type { Language } from '@/lib/translations';

const LANG_KEY = 'spectrum_lang';
const LANG_EVENT = 'spectrum:lang-change';

function normalizeLang(value: string | null | undefined): Language {
  return value === 'en' ? 'en' : 'zh';
}

export function useGlobalLanguage(defaultLang: Language = 'zh') {
  const [lang, setLangState] = useState<Language>(defaultLang);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLangState(normalizeLang(window.localStorage.getItem(LANG_KEY)));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (event: StorageEvent) => {
      if (event.key === LANG_KEY) {
        setLangState(normalizeLang(event.newValue));
      }
    };

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<Language>).detail;
      setLangState(normalizeLang(detail));
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(LANG_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LANG_EVENT, onCustom);
    };
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANG_KEY, next);
      window.dispatchEvent(new CustomEvent<Language>(LANG_EVENT, { detail: next }));
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'zh' : 'en');
  }, [lang, setLang]);

  return { lang, setLang, toggleLang };
}

