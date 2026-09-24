"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Lang } from "./dict";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: "mr", setLang: () => {} });

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
  const lang: Lang = chosen ?? (stored === "mr" || stored === "en" ? stored : "mr");

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
