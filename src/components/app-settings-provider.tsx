"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type LocaleMode = "en" | "tr";

interface AppSettingsContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  locale: LocaleMode;
  setLocale: (locale: LocaleMode) => void;
  text: (en: string, tr: string) => string;
}

const STORAGE_THEME_KEY = "studyforge:theme";
const STORAGE_LOCALE_KEY = "studyforge:locale";

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [locale, setLocale] = useState<LocaleMode>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_THEME_KEY);
      const savedLocale = window.localStorage.getItem(STORAGE_LOCALE_KEY);

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }

      if (savedLocale === "en" || savedLocale === "tr") {
        setLocale(savedLocale);
      }
    } catch {
      // Ignore storage errors and continue with defaults.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignore storage write errors.
    }
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_LOCALE_KEY, locale);
    } catch {
      // Ignore storage write errors.
    }
  }, [locale, ready]);

  const text = useCallback(
    (en: string, tr: string): string => (locale === "tr" ? tr : en),
    [locale]
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      locale,
      setLocale,
      text,
    }),
    [theme, locale, text]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return ctx;
}
