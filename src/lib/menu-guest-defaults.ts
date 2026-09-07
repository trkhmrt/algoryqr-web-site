import type { MenuDisplayCurrency } from "@/lib/menu-exchange-rates";
import type { MenuLocaleCode } from "@/components/menu-templates/shared/menu-locale";

export type MenuGuestDefaults = {
  locale: MenuLocaleCode;
  currency: MenuDisplayCurrency;
};

export type MenuGuestContext = {
  publicId?: string;
  businessName: string;
  identifier?: string;
};

type MenuGuestProfile = {
  match: (ctx: MenuGuestContext) => boolean;
  defaults: MenuGuestDefaults;
};

const FALLBACK_DEFAULTS: MenuGuestDefaults = {
  locale: "tr",
  currency: "TRY",
};

const MENU_GUEST_PROFILES: MenuGuestProfile[] = [
  {
    match: (ctx) =>
      /aya.?roof|ayaroof|roof.?lounge/i.test(ctx.businessName) ||
      /aya.?roof|ayaroof|roof/i.test(ctx.identifier ?? "") ||
      /aya.?roof|ayaroof|roof/i.test(ctx.publicId ?? ""),
    defaults: { locale: "en", currency: "USD" },
  },
  {
    match: (ctx) =>
      /ulasbayram|paradise/i.test(ctx.businessName) ||
      /ulasbayram|paradise/i.test(ctx.identifier ?? "") ||
      /ulasbayram|paradise/i.test(ctx.publicId ?? ""),
    defaults: { locale: "tr", currency: "TRY" },
  },
];

export function resolveMenuGuestDefaults(ctx: MenuGuestContext): MenuGuestDefaults {
  for (const profile of MENU_GUEST_PROFILES) {
    if (profile.match(ctx)) return profile.defaults;
  }
  return FALLBACK_DEFAULTS;
}

export function menuGuestScopeKey(publicId: string): string {
  return publicId;
}
