import { useCallback } from 'react';
import { translations, Language, Translation } from '@/lib/translations';
import { useGlobalLanguage } from '@/hooks/useGlobalLanguage';

interface UseTranslationReturn {
  t: Translation;
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export function useTranslation(initialLang: Language = 'en'): UseTranslationReturn {
  const { lang, setLang } = useGlobalLanguage(initialLang);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'zh' : 'en');
  }, [lang, setLang]);

  return {
    t: translations[lang],
    lang,
    setLang,
    toggleLang,
  };
}
