"use client";

import { useEffect } from "react";

import {
  useGoogleTranslateOptional,
  useTranslatedText,
} from "@/components/google-translate-provider";

export function MenuCategoryName({ name }: { name: string }) {
  const i18n = useGoogleTranslateOptional();
  const translated = useTranslatedText(name);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    void i18n?.ensureTranslations([trimmed]);
  }, [i18n, name]);

  return <>{translated}</>;
}
