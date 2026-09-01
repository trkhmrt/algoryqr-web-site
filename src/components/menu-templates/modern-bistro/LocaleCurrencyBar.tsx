"use client";

import { cn } from "@/lib/utils";

import { MENU_DISPLAY_CURRENCIES, type MenuDisplayCurrency } from "@/lib/menu-exchange-rates";

import { MENU_LOCALES, useMenuLocale } from "../shared/menu-locale";
import { useMenuCurrency } from "../shared/menu-currency";

const HOME_CURRENCIES: MenuDisplayCurrency[] = ["TRY", "EUR", "USD"];

export function ModernBistroLocaleCurrencyBar() {
  const { locale, setLocale } = useMenuLocale();
  const { displayCurrency, setDisplayCurrency } = useMenuCurrency();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {MENU_LOCALES.map((item) => {
          const active = item.code === locale;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLocale(item.code)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                active
                  ? "bg-[var(--mb-primary)] text-[var(--mb-primary-fg)]"
                  : "bg-[var(--mb-surface)] text-[var(--mb-muted)] ring-1 ring-[var(--mb-border)]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {HOME_CURRENCIES.map((code) => {
          const active = code === displayCurrency;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setDisplayCurrency(code)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                active
                  ? "bg-[var(--mb-primary)] text-[var(--mb-primary-fg)]"
                  : "bg-[var(--mb-surface)] text-[var(--mb-muted)] ring-1 ring-[var(--mb-border)]",
              )}
            >
              {code}
            </button>
          );
        })}
        {MENU_DISPLAY_CURRENCIES.filter((code) => !HOME_CURRENCIES.includes(code)).map((code) => {
          if (code === displayCurrency) {
            return (
              <button
                key={code}
                type="button"
                onClick={() => setDisplayCurrency(code)}
                className="rounded-full bg-[var(--mb-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mb-primary-fg)]"
              >
                {code}
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
