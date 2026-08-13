"use client";

import { useState } from "react";

import type { MenuProfileApiItem } from "@/lib/api";

import { LuxurySiteLayout } from "../luxury/LuxurySiteLayout";
import { CustomerAuthDialog } from "./CustomerAuthDialog";
import { useMenuLocale } from "./menu-locale";

type MenuEntryGateProps = {
  menu: MenuProfileApiItem;
  onContinueAsGuest: () => void;
  onAuthenticated: () => void;
};

export function MenuEntryGate({
  menu,
  onContinueAsGuest,
  onAuthenticated,
}: MenuEntryGateProps) {
  const { t, dir } = useMenuLocale();
  const [authOpen, setAuthOpen] = useState(false);
  const businessName = menu.businessName?.trim() || "Algory";

  return (
    <div dir={dir}>
      <LuxurySiteLayout menu={menu} showNav={false}>
        <div className="relative flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center px-5 py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--lx-gold)_18%,transparent),transparent_55%)]" />

          <div className="relative w-full max-w-md space-y-8 text-center">
            {menu.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menu.logoUrl}
                alt={businessName}
                className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-card)] font-display text-2xl text-gradient-gold">
                {businessName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] lx-muted">{businessName}</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-gradient-gold sm:text-4xl">
                {t.welcomeTitle}
              </h1>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full rounded-xl bg-gradient-gold px-4 py-3.5 text-sm font-semibold text-[var(--lx-primary-fg)] shadow-sm transition-opacity hover:opacity-90"
              >
                {t.login}
              </button>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="w-full rounded-xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] px-4 py-3 text-sm font-medium lx-fg transition-colors hover:border-[color-mix(in_oklch,var(--lx-gold)_40%,transparent)]"
              >
                {t.continueAsGuest}
              </button>
            </div>
          </div>
        </div>
      </LuxurySiteLayout>

      <CustomerAuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        menuId={menu.menuId}
        onSuccess={onAuthenticated}
        onContinueAsGuest={onContinueAsGuest}
        initialMode="login"
      />
    </div>
  );
}
