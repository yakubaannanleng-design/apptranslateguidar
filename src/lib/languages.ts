export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const POPULAR_LANGUAGES: Language[] = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
];

export const LOCAL_LANGUAGES: Language[] = [
  { code: "guidar", name: "Guidar", flag: "🇨🇲" },
];

export interface TranslationEntry {
  id: string;
  sourceLang: string;
  sourceWord: string;
  targetLang: string;
  targetWord: string;
  createdAt: number;
}