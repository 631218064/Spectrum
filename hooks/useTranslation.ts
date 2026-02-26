// hooks/useTranslation.ts
// 多语言切换和翻译函数

import { useState, useCallback } from 'react';
import { translations, Language, Translation } from '@/lib/translations';

interface UseTranslationReturn {
  t: Translation;
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export function useTranslation(initialLang: Language = 'en'): UseTranslationReturn {
  const [lang, setLang] = useState<Language>(initialLang);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  }, []);

  return {
    t: translations[lang],
    lang,
    setLang,
    toggleLang,
  };
}