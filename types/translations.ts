// types/translations.ts
// 多语言翻译的类型定义，确保 translations 对象的结构安全

export type Language = 'en' | 'zh';

export interface Translations {
  brand: string;
  tagline: string;
  toggleLang: string;
  getStarted: string;
  steps: string[];
  labels: {
    mbti: string;
    zodiac: string;
    pet: string;
    location: string;
    country: string;
    city: string;
    role: string;
    family: string;
    loveStyle: string;
    dynamics: string;
    idealType: string;
    contact: string;
    photo: string;
    looksFilter: string;
    matchLimit: string;
  };
  options: {
    pet: string[];
    family: string[];
    loveStyle: string[];
    dynamics: string[];
    roles: string[];
    mbti: string[];
  };
  dashboard: {
    matches: string;
    clueTitle: string;
    revealDay: string;
    terminate: string;
    unlocked: string;
    locked: string;
    waiting: string;
    sendMsg: string;
  };
}