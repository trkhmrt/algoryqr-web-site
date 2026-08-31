"use client";

import { MENU_LOCALES, useMenuLocale } from "@/components/menu-templates/shared/menu-locale";
import { cn } from "@/lib/utils";

type SiteLanguagePickerProps = {
  className?: string;
};

export function SiteLanguagePicker({ className }: SiteLanguagePickerProps) {
  const { locale, setLocale } = useMenuLocale();

  return (
    <div
      className={cn("flex items-center gap-0.5 rounded-full border border-[#e5e7eb] bg-background p-0.5 dark:border-border", className)}
      role="group"
      aria-label="Language"
    >
      {MENU_LOCALES.map((item) => {
        const selected = item.code === locale;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLocale(item.code)}
            aria-pressed={selected}
            className={
              selected
                ? "min-w-8 rounded-full bg-foreground px-2 py-1 text-[0.65rem] font-bold tracking-wide text-background"
                : "min-w-8 rounded-full px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
