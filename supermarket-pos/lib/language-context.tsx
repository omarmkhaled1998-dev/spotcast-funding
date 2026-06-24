"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Language } from "./translations";
import { t } from "./translations";

type LanguageContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  tr: (typeof t)["ar"];
  isRtl: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  tr: t.ar,
  isRtl: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("pos-lang") as Language | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem("pos-lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, tr: t[lang], isRtl: lang === "ar" }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
