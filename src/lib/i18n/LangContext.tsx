"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Lang } from "./dict";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
// English is the default; Marathi is one tap away in the header toggle.
export const DEFAULT_LANG: Lang = "en";
const LangCtx = createContext<Ctx>({ lang: DEFAULT_LANG, setLang: () => {} });

// localStorage is browser-only: the server snapshot keeps SSR and hydration
// on the default language, then the stored choice applies.
const subscribeNever = () => () => {};
const readStoredLang = () => {
  try {
    return localStorage.getItem("lang");
  } catch {
    return null;
  }
};

export function LangProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribeNever, readStoredLang, () => null);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const lang: Lang = chosen ?? (stored === "mr" || stored === "en" ? stored : DEFAULT_LANG);

  // Keep <html lang> in step so screen readers, hyphenation and the
  // :lang(mr) Devanagari font rule follow the chosen language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setChosen(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* storage blocked — language still applies for this session */
    }
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
