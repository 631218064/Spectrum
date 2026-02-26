// components/LanguageToggle.tsx
// 语言切换按钮，使用 useTranslation hook

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { lang, toggleLang, t } = useTranslation();

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-black/20 hover:bg-pink-500/10 transition-all"
      aria-label="Toggle language"
    >
      <Globe size={14} className="text-pink-400" />
      <span className="text-xs font-medium tracking-widest text-pink-100">
        {t.toggleLang}
      </span>
    </button>
  );
}