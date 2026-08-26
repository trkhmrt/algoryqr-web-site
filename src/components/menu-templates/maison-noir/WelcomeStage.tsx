"use client";

import type { ComponentType } from "react";
import { CalendarDays, MessageSquareText, Phone } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";
import { ContactPanel } from "../shared/ContactPanel";
import { FeedbackForm } from "../shared/FeedbackForm";
import { MenuLandingPanelShell } from "../shared/MenuLandingPanelShell";
import { useMenuExperience } from "../shared/menu-experience";
import type { MenuLandingAction } from "../shared/menu-landing";
import { usePublicMenuTheme } from "../shared/public-menu-theme";
import { ReservationForm } from "../shared/ReservationForm";
import { useMenuFeedback } from "../shared/use-menu-feedback";
import { MaisonNoirShell, MaisonNoirWelcomeFrame } from "./Shell";
import { MAISON_NOIR_HERO_IMAGE, maisonNoirMonogram } from "./styles";

const SECONDARY_ACTIONS: Array<{
  key: Exclude<MenuLandingAction, "menu">;
  title: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "reservation", title: "Rezervasyon", icon: CalendarDays },
  { key: "feedback", title: "Geri Bildirim", icon: MessageSquareText },
  { key: "contact", title: "İletişim", icon: Phone },
];

type MaisonNoirWelcomeStageProps = {
  menu: MenuProfileApiItem;
};

export function MaisonNoirWelcomeStage({ menu }: MaisonNoirWelcomeStageProps) {
  const theme = usePublicMenuTheme();
  const { welcomePanel, selectWelcomeAction, backToLandingHub } = useMenuExperience();
  const feedback = useMenuFeedback(
    menu.menuId,
    menu.ratingAvg != null ? Number(menu.ratingAvg) : null,
    menu.ratingCount ?? 0,
  );

  if (welcomePanel === "landing") {
    return (
      <MaisonNoirWelcomeFrame>
        <WelcomeLanding
          menu={menu}
          heroImage={theme.heroImage || MAISON_NOIR_HERO_IMAGE}
          defaultSlogan={theme.defaultSlogan}
          onSelect={selectWelcomeAction}
        />
      </MaisonNoirWelcomeFrame>
    );
  }

  return (
    <MaisonNoirShell menu={menu}>
      <div className="mx-auto max-w-xl px-6 py-10">
        <MenuLandingPanelShell
          onBack={backToLandingHub}
          className="min-h-[50vh]"
          backClassName="mn-tracked text-[0.58rem] text-[var(--mn-muted)] hover:text-[var(--mn-primary)]"
        >
          {welcomePanel === "reservation" ? (
            <ReservationForm
              menuId={menu.menuId}
              className="space-y-3 px-2 py-4"
              inputClassName="w-full border border-[var(--mn-border)] bg-[var(--mn-surface)] px-3 py-2 text-sm text-[var(--mn-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--mn-primary)]/40"
              buttonClassName="inline-flex h-11 w-full items-center justify-center border border-[var(--mn-primary)]/60 bg-[var(--mn-primary)] px-4 text-sm font-medium text-[var(--mn-primary-fg)] disabled:opacity-60"
            />
          ) : null}
          {welcomePanel === "feedback" ? (
            <div className="space-y-3 px-2 py-4">
              <h2 className="font-display text-3xl text-[var(--mn-fg)]">Geri Bildirim</h2>
              <FeedbackForm
                title="Menüyü puanla"
                ratingAvg={feedback.menu.ratingAvg}
                ratingCount={feedback.menu.ratingCount}
                userRating={feedback.menu.userRating}
                submitting={feedback.menu.submitting}
                onSubmit={feedback.menu.onSubmit}
                buttonClassName="inline-flex h-11 w-full items-center justify-center border border-[var(--mn-primary)]/60 bg-[var(--mn-primary)] px-4 text-sm font-medium text-[var(--mn-primary-fg)] disabled:opacity-60"
              />
            </div>
          ) : null}
          {welcomePanel === "contact" ? (
            <ContactPanel
              menu={menu}
              className="space-y-3 px-2 py-4"
              itemClassName="flex items-center gap-3 border border-[var(--mn-border)] bg-[var(--mn-surface)] px-4 py-3 text-sm text-[var(--mn-fg)]"
            />
          ) : null}
        </MenuLandingPanelShell>
      </div>
    </MaisonNoirShell>
  );
}

function WelcomeLanding({
  menu,
  heroImage,
  defaultSlogan,
  onSelect,
}: {
  menu: MenuProfileApiItem;
  heroImage: string;
  defaultSlogan: string;
  onSelect: (action: MenuLandingAction) => void;
}) {
  const monogram = maisonNoirMonogram(menu.businessName);
  const nameParts = menu.businessName.trim().split(/\s+/).filter(Boolean);
  const primaryName = nameParts[0] ?? menu.businessName;
  const secondaryName = nameParts.slice(1).join(" ");
  const slogan = menu.slogan?.trim() || defaultSlogan;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        alt=""
        width={1280}
        height={1600}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="mn-veil absolute inset-0" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-between px-8 py-14 text-center">
        <div className="mn-rise">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[var(--mn-primary)]/50">
            {menu.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={menu.logoUrl}
                alt={menu.businessName}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <span className="font-display text-2xl text-[var(--mn-primary)]">{monogram}</span>
            )}
          </div>
        </div>

        <div className="mn-rise" style={{ animationDelay: "120ms" }}>
          <p className="mn-tracked text-[0.6rem] text-[var(--mn-muted)]">
            Dijital Menü
          </p>
          <h1 className="mt-6 font-display text-6xl leading-[0.95] tracking-tight text-[var(--mn-fg)] sm:text-7xl">
            {primaryName}
            {secondaryName ? (
              <span className="block italic text-[var(--mn-primary)]">{secondaryName}</span>
            ) : null}
          </h1>
          <div className="mn-hairline mx-auto mt-8 w-40" />
          <p className="mx-auto mt-8 max-w-xs text-sm leading-relaxed text-[var(--mn-muted)]">
            {slogan}
          </p>
        </div>

        <div className="mn-rise w-full space-y-8" style={{ animationDelay: "240ms" }}>
          <button
            type="button"
            onClick={() => onSelect("menu")}
            className="group block w-full border border-[var(--mn-primary)]/60 py-5 transition-colors duration-500 hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)]"
          >
            <span className="mn-tracked text-[0.62rem]">Menüyü Görüntüle</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {SECONDARY_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => onSelect(action.key)}
                  className="inline-flex items-center gap-2 text-[var(--mn-muted)]/70 transition-colors hover:text-[var(--mn-primary)]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="mn-tracked text-[0.5rem]">{action.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
