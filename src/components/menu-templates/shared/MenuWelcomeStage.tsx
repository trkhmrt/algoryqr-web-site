"use client";

import type { MenuProfileApiItem } from "@/lib/api";

import { LuxurySiteLayout } from "../luxury/LuxurySiteLayout";
import { MenuLandingScreens } from "./MenuLandingScreens";
import { useMenuExperience } from "./menu-experience";
import { usePublicMenuTheme } from "./public-menu-theme";
import { useMenuFeedback } from "./use-menu-feedback";

type MenuWelcomeStageProps = {
  menu: MenuProfileApiItem;
};

export function MenuWelcomeStage({ menu }: MenuWelcomeStageProps) {
  const theme = usePublicMenuTheme();
  const { welcomePanel, selectWelcomeAction, backToLandingHub } = useMenuExperience();
  const feedback = useMenuFeedback(
    menu.menuId,
    menu.ratingAvg != null ? Number(menu.ratingAvg) : null,
    menu.ratingCount ?? 0,
  );

  return (
    <LuxurySiteLayout menu={menu}>
      <MenuLandingScreens
        menu={menu}
        panel={welcomePanel}
        onSelect={selectWelcomeAction}
        onBackToLanding={backToLandingHub}
        feedback={feedback.menu}
        reservationBackgroundUrl={theme.reservationBackgroundUrl}
        contactBackgroundUrl={theme.contactBackgroundUrl}
        feedbackBackgroundUrl={theme.feedbackBackgroundUrl}
        hubClassName="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
        hubTitleClassName="font-display text-3xl font-semibold tracking-tight text-gradient-gold sm:text-4xl"
        hubSubtitleClassName="mt-2 text-sm uppercase tracking-[0.16em] lx-muted"
        hubCardClassName="flex items-center gap-4 rounded-2xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] px-4 py-4 text-left transition hover:border-[color-mix(in_oklch,var(--lx-gold)_45%,transparent)] sm:px-5"
        panelClassName="min-h-[50vh]"
        formClassName="space-y-3 px-4 py-4"
        inputClassName="w-full rounded-lg border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_80%,transparent)] px-3 py-2 text-sm lx-fg focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--lx-gold)_35%,transparent)]"
        buttonClassName="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-gold px-4 text-sm font-semibold text-[var(--lx-primary-fg)] disabled:opacity-60"
        contactItemClassName="flex items-center gap-3 rounded-xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_70%,transparent)] px-4 py-3 text-sm lx-fg"
        feedbackWrapClassName="mx-auto max-w-xl space-y-4 px-4 py-6 sm:px-6"
      />
    </LuxurySiteLayout>
  );
}
