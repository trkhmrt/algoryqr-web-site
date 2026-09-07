"use client";

import type { MenuProfileApiItem } from "@/lib/api";
import { useMenuLocale } from "../shared/menu-locale";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import {
  KAHVE_SOKAGI_HERO_IMAGE,
  KAHVE_SOKAGI_LOGO,
  KAHVE_SOKAGI_YERLI_URETIM,
} from "./styles";

type KahveBrandHeroProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "updatedAt">;
  onBrandClick?: () => void;
};

function formatMenuUpdatedAt(value: string | null | undefined, locale: string): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function KahveBrandHero({ menu, onBrandClick }: KahveBrandHeroProps) {
  const theme = usePublicMenuTheme();
  const { t, locale } = useMenuLocale();
  const logoSrc = menu.logoUrl?.trim() || KAHVE_SOKAGI_LOGO;
  const heroSrc = theme.heroImage || KAHVE_SOKAGI_HERO_IMAGE;
  const updatedLabel = formatMenuUpdatedAt(menu.updatedAt, locale);

  return (
    <header className="relative w-full overflow-hidden rounded-b-[2rem] shadow-[var(--ks-hero-shadow)]">
      <div className="relative aspect-[5/4] w-full sm:aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-[#200e04]/70" />

        <button
          type="button"
          onClick={onBrandClick}
          aria-label={menu.businessName}
          className="absolute left-1/2 top-1/2 z-10 flex h-[42%] w-[42%] max-h-44 max-w-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/40 bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition active:scale-[0.98] sm:h-44 sm:w-44"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={menu.businessName}
            className="h-full w-full object-contain"
          />
        </button>

        {updatedLabel ? (
          <div className="absolute bottom-3 left-3 z-10 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md sm:bottom-4 sm:left-4 sm:text-[11px]">
            {t.lastUpdated}: {updatedLabel}
          </div>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={KAHVE_SOKAGI_YERLI_URETIM}
          alt="Yerli Üretim"
          className="absolute bottom-3 right-3 z-10 h-9 w-auto rounded-sm shadow-[0_6px_16px_rgba(0,0,0,0.35)] sm:bottom-4 sm:right-4 sm:h-11"
        />
      </div>
    </header>
  );
}
