"use client";

import type { MenuProfileApiItem } from "@/lib/api";

import { ContactPanel } from "./ContactPanel";
import { FeedbackForm } from "./FeedbackForm";
import { MenuLandingHub } from "./MenuLandingHub";
import { MenuLandingPanelShell } from "./MenuLandingPanelShell";
import type { MenuLandingAction, MenuLandingPanel } from "./menu-landing";
import { ReservationForm } from "./ReservationForm";

type FeedbackControl = {
  ratingAvg: number | null;
  ratingCount: number;
  userRating?: number | null;
  submitting?: boolean;
  onSubmit: (score: number, comment?: string) => void | Promise<void>;
};

type MenuLandingScreensProps = {
  menu: MenuProfileApiItem;
  panel: Exclude<MenuLandingPanel, "menu">;
  onSelect: (action: MenuLandingAction) => void;
  onBackToLanding: () => void;
  feedback: FeedbackControl;
  hubClassName?: string;
  hubCardClassName?: string;
  hubTitleClassName?: string;
  hubSubtitleClassName?: string;
  panelClassName?: string;
  backClassName?: string;
  formClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  contactItemClassName?: string;
  feedbackWrapClassName?: string;
  reservationBackgroundUrl?: string;
  contactBackgroundUrl?: string;
  feedbackBackgroundUrl?: string;
};

export function MenuLandingScreens({
  menu,
  panel,
  onSelect,
  onBackToLanding,
  feedback,
  hubClassName,
  hubCardClassName,
  hubTitleClassName,
  hubSubtitleClassName,
  panelClassName,
  backClassName,
  formClassName,
  inputClassName,
  buttonClassName,
  contactItemClassName,
  feedbackWrapClassName,
  reservationBackgroundUrl,
  contactBackgroundUrl,
  feedbackBackgroundUrl,
}: MenuLandingScreensProps) {
  if (panel === "landing") {
    return (
      <MenuLandingHub
        businessName={menu.businessName}
        slogan={menu.slogan}
        logoUrl={menu.logoUrl}
        onSelect={onSelect}
        className={hubClassName}
        cardClassName={hubCardClassName}
        titleClassName={hubTitleClassName}
        subtitleClassName={hubSubtitleClassName}
      />
    );
  }

  if (panel === "reservation") {
    const form = (
      <MenuLandingPanelShell onBack={onBackToLanding} className={panelClassName} backClassName={backClassName}>
        <ReservationForm
          menuId={menu.menuId}
          className={formClassName}
          inputClassName={inputClassName}
          buttonClassName={buttonClassName}
        />
      </MenuLandingPanelShell>
    );

    if (!reservationBackgroundUrl) return form;

    return (
      <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden">
        <img
          src={reservationBackgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--lx-bg,oklch(0.16_0.012_60))_58%,transparent)]" />
        <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-xl items-center px-4 py-8 sm:px-6">
          <div className="w-full rounded-2xl border border-[var(--lx-border,rgba(255,255,255,0.12))] bg-[color-mix(in_oklch,var(--lx-bg,oklch(0.16_0.012_60))_82%,transparent)] p-1 shadow-2xl backdrop-blur-md">
            {form}
          </div>
        </div>
      </div>
    );
  }

  if (panel === "feedback") {
    const feedbackPanel = (
      <MenuLandingPanelShell onBack={onBackToLanding} className={panelClassName} backClassName={backClassName}>
        <div className={feedbackWrapClassName ?? "space-y-3 px-4 py-4"}>
          <h2 className="font-display text-2xl font-semibold text-gradient-gold">Geri Bildirim</h2>
          <FeedbackForm
            title="Menüyü puanla"
            ratingAvg={feedback.ratingAvg}
            ratingCount={feedback.ratingCount}
            userRating={feedback.userRating}
            submitting={feedback.submitting}
            onSubmit={feedback.onSubmit}
            buttonClassName={buttonClassName}
          />
        </div>
      </MenuLandingPanelShell>
    );

    if (!feedbackBackgroundUrl) return feedbackPanel;

    return (
      <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden">
        <img
          src={feedbackBackgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--lx-bg,oklch(0.16_0.012_60))_58%,transparent)]" />
        <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-xl items-center px-4 py-8 sm:px-6">
          <div className="w-full rounded-2xl border border-[var(--lx-border,rgba(255,255,255,0.12))] bg-[color-mix(in_oklch,var(--lx-bg,oklch(0.16_0.012_60))_82%,transparent)] p-1 shadow-2xl backdrop-blur-md">
            {feedbackPanel}
          </div>
        </div>
      </div>
    );
  }

  if (panel === "contact") {
    const contactPanel = (
      <MenuLandingPanelShell onBack={onBackToLanding} className={panelClassName} backClassName={backClassName}>
        <ContactPanel menu={menu} className={formClassName} itemClassName={contactItemClassName} />
      </MenuLandingPanelShell>
    );

    if (!contactBackgroundUrl) {
      return <div className="mx-auto max-w-xl">{contactPanel}</div>;
    }

    return (
      <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden">
        <img
          src={contactBackgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--lx-bg,oklch(0.16_0.012_60))_58%,transparent)]" />
        <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-xl items-center px-4 py-8 sm:px-6">
          <div className="w-full rounded-2xl border border-[var(--lx-border,rgba(255,255,255,0.12))] bg-[color-mix(in_oklch,var(--lx-bg,oklch(0.16_0.012_60))_82%,transparent)] p-1 shadow-2xl backdrop-blur-md">
            {contactPanel}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
