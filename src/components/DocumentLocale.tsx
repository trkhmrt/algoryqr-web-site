"use client";

import { useEffect } from "react";

import { useMenuLocale } from "@/components/menu-templates/shared/menu-locale";

export function DocumentLocale() {
  const { locale, dir } = useMenuLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [dir, locale]);

  return null;
}
