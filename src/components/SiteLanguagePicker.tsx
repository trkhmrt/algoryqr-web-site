"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { useMenuCurrency } from "@/components/menu-templates/shared/menu-currency";
import { MENU_LOCALES, useMenuLocale } from "@/components/menu-templates/shared/menu-locale";
import { Tx } from "@/components/google-translate-provider";
import { MENU_DISPLAY_CURRENCIES } from "@/lib/menu-exchange-rates";
import { cn } from "@/lib/utils";

type SiteLanguagePickerProps = {
  className?: string;
  compact?: boolean;
};

function SiteLocaleCurrencyPanel({ onSelect }: { onSelect: () => void }) {
  const { locale, setLocale } = useMenuLocale();
  const { displayCurrency, setDisplayCurrency } = useMenuCurrency();

  const itemClass = (selected: boolean) =>
    cn(
      "flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide",
      selected
        ? "bg-foreground text-background"
        : "text-foreground hover:bg-muted",
    );

  return (
    <>
      <p className="px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Tx>Dil</Tx>
      </p>
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
              onSelect();
            }}
            className={itemClass(selected)}
          >
            {item.label}
          </button>
        );
      })}
      <div className="my-1 border-t border-border" />
      <p className="px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Tx>Kur</Tx>
      </p>
      {MENU_DISPLAY_CURRENCIES.map((code) => {
        const selected = code === displayCurrency;
        return (
          <button
            key={code}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => {
              setDisplayCurrency(code);
              onSelect();
            }}
            className={itemClass(selected)}
          >
            {code}
          </button>
        );
      })}
    </>
  );
}

function useSitePickerOpenState() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { ensureRates } = useMenuCurrency();

  useEffect(() => {
    if (!open) return;
    void ensureRates();
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
  }, [open, ensureRates]);

  return { open, setOpen, rootRef };
}

function DropdownShell({
  className,
  trigger,
  panelClassName,
  children,
  open,
  setOpen,
  rootRef,
}: {
  className?: string;
  trigger: ReactNode;
  panelClassName: string;
  children: ReactNode;
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger}
      {open ? (
        <div role="listbox" aria-label="Dil ve kur" className={panelClassName}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function SiteLanguagePicker({ className, compact = false }: SiteLanguagePickerProps) {
  const { locale } = useMenuLocale();
  const { displayCurrency } = useMenuCurrency();
  const current = MENU_LOCALES.find((item) => item.code === locale) ?? MENU_LOCALES[0];
  const { open, setOpen, rootRef } = useSitePickerOpenState();

  const close = () => setOpen(false);
  const toggle = () => setOpen((value) => !value);

  return (
    <DropdownShell
      className={className}
      open={open}
      setOpen={setOpen}
      rootRef={rootRef}
      panelClassName="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-background p-1 shadow-xl"
      trigger={
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggle}
          aria-label="Dil ve kur seç"
          className={cn(
            "flex items-center justify-center whitespace-nowrap rounded-full border border-border font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
            compact
              ? "h-8 gap-0.5 px-2 text-[0.5625rem]"
              : "h-9 min-w-[4.5rem] gap-1 px-2.5 text-[0.625rem] sm:h-10 sm:text-xs",
          )}
        >
          <span>{current.label}</span>
          <span aria-hidden className="opacity-40">
            |
          </span>
          <span>{displayCurrency}</span>
          <ChevronDown
            className={cn(
              "transition",
              compact ? "h-3 w-3" : "h-3.5 w-3.5",
              open && "rotate-180",
            )}
          />
        </button>
      }
    >
      <SiteLocaleCurrencyPanel onSelect={close} />
    </DropdownShell>
  );
}
