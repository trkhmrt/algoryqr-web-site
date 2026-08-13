"use client";

import { CalendarDays, MessageSquareText, Phone, UtensilsCrossed } from "lucide-react";

import type { MenuLandingAction } from "./menu-landing";

const ACTIONS: Array<{
  key: MenuLandingAction;
  title: string;
  description: string;
  icon: typeof UtensilsCrossed;
}> = [
  {
    key: "reservation",
    title: "Rezervasyon",
    description: "Masa ayırtın",
    icon: CalendarDays,
  },
  {
    key: "menu",
    title: "Menü",
    description: "Ürünlere göz atın",
    icon: UtensilsCrossed,
  },
  {
    key: "feedback",
    title: "Geri Bildirim",
    description: "Deneyiminizi puanlayın",
    icon: MessageSquareText,
  },
  {
    key: "contact",
    title: "İletişim",
    description: "Bize ulaşın",
    icon: Phone,
  },
];

type MenuLandingHubProps = {
  businessName: string;
  slogan?: string | null;
  logoUrl?: string | null;
  onSelect: (action: MenuLandingAction) => void;
  className?: string;
  cardClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function MenuLandingHub({
  businessName,
  slogan,
  logoUrl,
  onSelect,
  className,
  cardClassName,
  titleClassName,
  subtitleClassName,
}: MenuLandingHubProps) {
  return (
    <div className={className ?? "space-y-6 px-4 py-8"}>
      <div className="space-y-3 text-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={businessName}
            className="mx-auto h-16 w-16 rounded-2xl object-cover sm:h-20 sm:w-20"
          />
        ) : null}
        <div>
          <h1 className={titleClassName ?? "text-2xl font-semibold tracking-tight"}>
            {businessName}
          </h1>
          {slogan ? (
            <p className={subtitleClassName ?? "mt-1 text-sm text-muted-foreground"}>{slogan}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => onSelect(action.key)}
              className={
                cardClassName ??
                "flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
              }
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--lx-gold)_16%,transparent)] lx-gold">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{action.title}</span>
                <span className="block text-xs text-muted-foreground">{action.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
