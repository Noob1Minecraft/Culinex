import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language, LocalizedString } from '../types/recipe';
import { ru, type TranslationKey } from './ru';
import { en } from './en';
import { kk } from './kk';
const dictionaries = { ru, en, kk };
export function storedLanguage(): Language {
  try { const value = localStorage.getItem('culinex.language'); return value === 'en' || value === 'kk' ? value : 'ru'; } catch { return 'ru'; }
}
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void } | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(storedLanguage);
  useEffect(() => { document.documentElement.lang = language; try { localStorage.setItem('culinex.language', language); } catch { /* Storage can be disabled. */ } }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}
export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider missing');
  return { ...context, t: (key: TranslationKey) => dictionaries[context.language]?.[key] ?? ru[key],
    local: (value: LocalizedString) => value[context.language] || value.ru,
    time: (timestamp: number) => new Intl.DateTimeFormat(context.language === 'kk' ? 'kk-KZ' : context.language, { hour: '2-digit', minute: '2-digit', hour12: false }).format(timestamp),
    date: (timestamp: number) => new Intl.DateTimeFormat(context.language === 'kk' ? 'kk-KZ' : context.language, { day: 'numeric', month: 'short' }).format(timestamp),
  };
}
