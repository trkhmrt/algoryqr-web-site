"use client";

import type { MenuProfileApiItem } from "@/lib/api";

import { maisonNoirMonogram } from "./styles";

type MenuHeroIntroProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "slogan">;
  defaultSlogan: string;
};

function splitBusinessName(businessName: string) {
  const parts = businessName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { primary: businessName.trim() || "Menü", secondary: null as string | null };
  }
  return {
    primary: parts.slice(0, -1).join(" "),
    secondary: parts[parts.length - 1] ?? null,
  };
}

export function MaisonNoirMenuHeroIntro({ menu, defaultSlogan }: MenuHeroIntroProps) {
  const { primary, secondary } = splitBusinessName(menu.businessName);
  const slogan = menu.slogan?.trim() || defaultSlogan;
  const monogram = maisonNoirMonogram(menu.businessName);

  return (
    <section className="relative mx-auto max-w-xl px-8 pb-4 pt-[max(2.5rem,env(safe-area-inset-top))] text-center">
      <div className="mn-rise mx-auto flex h-16 w-16 items-center justify-center border border-[var(--mn-border)]/80 bg-[var(--mn-surface)]/35 backdrop-blur-sm">
        {menu.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={menu.logoUrl} alt="" className="h-10 w-10 object-contain" />
        ) : (
          <span className="font-display text-2xl text-[var(--mn-primary)]">{monogram}</span>
        )}
      </div>

      <div className="mn-rise mt-8 space-y-5" style={{ animationDelay: "80ms" }}>
        <p className="mn-tracked text-[0.58rem] text-[var(--mn-muted)]">Dijital Menü</p>
        <h1 className="font-display text-[clamp(2.75rem,11vw,4.25rem)] leading-[0.92] tracking-tight text-[var(--mn-fg)]">
          {primary}
          {secondary ? (
            <span className="mt-1 block italic text-[var(--mn-primary)]">{secondary}</span>
          ) : null}
        </h1>
        <div className="mn-hairline mx-auto w-32" />
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-[var(--mn-muted)]">{slogan}</p>
      </div>

      <div
        className="mn-rise mx-auto mt-10 h-px w-px shadow-[0_0_0_1px_var(--mn-primary)]"
        style={{ animationDelay: "160ms" }}
        aria-hidden
      />
    </section>
  );
}
