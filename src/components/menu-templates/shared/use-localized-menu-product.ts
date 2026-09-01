"use client";

import { useEffect, useMemo } from "react";

import { useGoogleTranslateOptional } from "@/components/google-translate-provider";
import type { MenuProductApiItem } from "@/lib/api";
import { collectMenuContentTexts, localizeProducts } from "@/lib/menu-content-i18n";

const EMPTY_DICT: Record<string, string> = {};

export function useLocalizedMenuProduct(
  product: MenuProductApiItem | null,
): MenuProductApiItem | null {
  const i18n = useGoogleTranslateOptional();
  const dict = i18n?.dict ?? EMPTY_DICT;
  const translate = i18n?.translate;
  const ensureTranslations = i18n?.ensureTranslations;

  const texts = useMemo(
    () => (product ? collectMenuContentTexts([product], []) : []),
    [product],
  );

  useEffect(() => {
    if (texts.length === 0) return;
    void ensureTranslations?.(texts);
  }, [ensureTranslations, texts]);

  return useMemo(() => {
    if (!product) return null;
    return localizeProducts([product], dict, translate)[0] ?? product;
  }, [dict, product, translate]);
}
