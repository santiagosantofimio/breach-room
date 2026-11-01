import { createContext, use, useEffect, useMemo, useState, type ReactNode } from "react";
import { browserStore } from "../progress/safeStorage";
import { en, type Dictionary } from "./en";
import { es } from "./es";

const LANGUAGE_KEY = "breach-room.language";
const DICTIONARIES = { en, es };

export type Language = keyof typeof DICTIONARIES;
export const LANGUAGES = Object.keys(DICTIONARIES) as Language[];

interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

function storedLanguage(): Language {
  return browserStore.read(LANGUAGE_KEY) === "es" ? "es" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(storedLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    browserStore.write(LANGUAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: DICTIONARIES[language] }), [language]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  const value = use(I18nContext);
  if (value === null) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
