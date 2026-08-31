"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { MENU_LOCALES, useMenuLocale } from "./menu-locale";

type MenuLanguagePickerProps = {
  className?: string;
  variant?: "group" | "dropdown" | "minimal";
};

export function MenuLanguagePicker({
  className,
  variant = "group",
}: MenuLanguagePickerProps) {
  const { locale, setLocale } = useMenuLocale();
  const current = MENU_LOCALES.find((item) => item.code === locale) ?? MENU_LOCALES[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (variant === "minimal") {
    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Dil seç"
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 min-w-[1.75rem] items-center justify-center px-1 text-[0.625rem] font-normal uppercase tracking-[0.14em] text-[var(--lx-muted)] transition-colors hover:text-[var(--lx-fg)]"
        >
          {current.label}
        </button>
        {open ? (
          <div
            role="listbox"
            aria-label="Diller"
            className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[4.5rem] overflow-hidden rounded-lg border border-[var(--lx-border)] bg-[var(--lx-card)] p-0.5 shadow-lg"
          >
            {MENU_LOCALES.map((item) => {
              const selected = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLocale(item.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[0.625rem] font-normal uppercase tracking-[0.12em]",
                    selected
                      ? "bg-gradient-gold text-[var(--lx-primary-fg)]"
                      : "lx-fg hover:bg-[color-mix(in_oklch,var(--lx-gold)_12%,transparent)]",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Dil seç"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 min-w-10 items-center justify-center gap-0.5 rounded-full border border-[var(--lx-border)] px-2.5 text-xs font-semibold tracking-wide lx-fg"
        >
          {current.label}
          <ChevronDown className={cn("h-3.5 w-3.5 lx-muted transition", open && "rotate-180")} />
        </button>
        {open ? (
          <div
            role="listbox"
            aria-label="Diller"
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[7.5rem] overflow-hidden rounded-xl border border-[var(--lx-border)] bg-[var(--lx-card)] p-1 shadow-xl"
          >
            {MENU_LOCALES.map((item) => {
              const selected = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLocale(item.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-wide",
                    selected
                      ? "bg-gradient-gold text-[var(--lx-primary-fg)]"
                      : "lx-fg hover:bg-[color-mix(in_oklch,var(--lx-gold)_12%,transparent)]",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "flex items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background/80 p-1 shadow-sm backdrop-blur"
      }
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
                ? "min-w-11 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold tracking-wide text-background shadow"
                : "min-w-11 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
