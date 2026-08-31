"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  TRANSLATE_MAX_TEXTS_PER_REQUEST,
  chunkTexts,
  isTranslateTarget,
  uniqueTexts,
  type TranslateResponseBody,
  type TranslateTarget,
} from "@/lib/google-translate";
import { useMenuLocale } from "@/components/menu-templates/shared/menu-locale";

type GoogleTranslateContextValue = {
  dict: Record<string, string>;
  translate: (text: string) => string;
  ensureTranslations: (texts: string[]) => Promise<void>;
};

const GoogleTranslateContext = createContext<GoogleTranslateContextValue | null>(null);

async function fetchTranslations(
  target: TranslateTarget,
  texts: string[],
): Promise<Record<string, string>> {
  const merged: Record<string, string> = {};
  for (const chunk of chunkTexts(uniqueTexts(texts), TRANSLATE_MAX_TEXTS_PER_REQUEST)) {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, texts: chunk }),
    });
    if (!response.ok) continue;
    const payload = (await response.json()) as TranslateResponseBody;
    Object.assign(merged, payload.translations ?? {});
  }
  return merged;
}

type GoogleTranslateProviderProps = {
  children: ReactNode;
};

export function GoogleTranslateProvider({ children }: GoogleTranslateProviderProps) {
  const { locale } = useMenuLocale();
  const [dict, setDict] = useState<Record<string, string>>({});
  const dictRef = useRef(dict);
  const inFlightRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());
  const [needsFlush, setNeedsFlush] = useState(false);

  useEffect(() => {
    setDict({});
    dictRef.current = {};
    inFlightRef.current.clear();
    pendingRef.current.clear();
    setNeedsFlush(false);
  }, [locale]);

  const mergeDict = useCallback((incoming: Record<string, string>) => {
    if (Object.keys(incoming).length === 0) return;
    setDict((prev) => {
      const next = { ...prev, ...incoming };
      dictRef.current = next;
      return next;
    });
  }, []);

  const flush = useCallback(
    async (texts: string[]) => {
      if (!isTranslateTarget(locale)) return;
      const current = dictRef.current;
      const missing = uniqueTexts(texts).filter(
        (text) => current[text] == null && !inFlightRef.current.has(text),
      );
      if (missing.length === 0) return;

      for (const text of missing) inFlightRef.current.add(text);
      try {
        const translations = await fetchTranslations(locale, missing);
        const resolved: Record<string, string> = {};
        for (const text of missing) {
          resolved[text] = translations[text] ?? text;
        }
        mergeDict(resolved);
      } finally {
        for (const text of missing) inFlightRef.current.delete(text);
      }
    },
    [locale, mergeDict],
  );

  useEffect(() => {
    if (!needsFlush) return;
    setNeedsFlush(false);
    const batch = [...pendingRef.current];
    pendingRef.current.clear();
    void flush(batch);
  }, [needsFlush, flush]);

  const translate = useCallback(
    (text: string): string => {
      if (!text || !isTranslateTarget(locale)) return text;
      const key = text.trim();
      if (!key) return text;
      const hit = dict[key];
      if (hit != null) return hit;
      if (!pendingRef.current.has(key) && !inFlightRef.current.has(key)) {
        pendingRef.current.add(key);
        queueMicrotask(() => setNeedsFlush(true));
      }
      return text;
    },
    [dict, locale],
  );

  const ensureTranslations = useCallback(
    async (texts: string[]) => {
      await flush(texts);
    },
    [flush],
  );

  const value = useMemo<GoogleTranslateContextValue>(
    () => ({ dict, translate, ensureTranslations }),
    [dict, translate, ensureTranslations],
  );

  return (
    <GoogleTranslateContext.Provider value={value}>{children}</GoogleTranslateContext.Provider>
  );
}

export function useGoogleTranslate(): GoogleTranslateContextValue {
  const ctx = useContext(GoogleTranslateContext);
  if (!ctx) {
    throw new Error("useGoogleTranslate must be used within GoogleTranslateProvider");
  }
  return ctx;
}

export function useGoogleTranslateOptional(): GoogleTranslateContextValue | null {
  return useContext(GoogleTranslateContext);
}

export function useT(): (text: string) => string {
  const ctx = useGoogleTranslateOptional();
  if (!ctx) return (text: string) => text;
  return ctx.translate;
}

export function useTranslatedText(text: string): string {
  return useT()(text);
}

export function Tx({ children }: { children: string }) {
  return <>{useTranslatedText(children)}</>;
}
