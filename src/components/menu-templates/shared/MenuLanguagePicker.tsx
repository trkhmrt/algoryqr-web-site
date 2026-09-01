"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { MENU_DISPLAY_CURRENCIES } from "@/lib/menu-exchange-rates";
import { cn } from "@/lib/utils";

import { MENU_LOCALES, useMenuLocale } from "./menu-locale";
import { useMenuCurrency } from "./menu-currency";

type MenuLanguagePickerProps = {
  className?: string;
  variant?: "group" | "dropdown" | "minimal";
};

type PanelProps = {
  onSelect: () => void;
  languageItemClass: (selected: boolean) => string;
  currencyItemClass: (selected: boolean) => string;
  sectionLabelClass: string;
  dividerClass: string;
  languageLabel: string;
  currencyLabel: string;
};

function LocaleCurrencyPanel({
  onSelect,
  languageItemClass,
  currencyItemClass,
  sectionLabelClass,
  dividerClass,
  languageLabel,
  currencyLabel,
}: PanelProps) {
  const { locale, setLocale } = useMenuLocale();
  const { displayCurrency, setDisplayCurrency } = useMenuCurrency();

  return (
    <>
      <p className={sectionLabelClass}>{languageLabel}</p>
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
            className={languageItemClass(selected)}
          >
            {item.label}
          </button>
        );
      })}
      <div className={dividerClass} />
      <p className={sectionLabelClass}>{currencyLabel}</p>
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
            className={currencyItemClass(selected)}
          >
            {code}
          </button>
        );
      })}
    </>
  );
}

function usePickerOpenState() {
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
  listLabel,
}: {
  className?: string;
  trigger: ReactNode;
  panelClassName: string;
  children: ReactNode;
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  listLabel: string;
}) {
  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger}
      {open ? (
        <div role="listbox" aria-label={listLabel} className={panelClassName}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuLanguagePicker({
  className,
  variant = "group",
}: MenuLanguagePickerProps) {
  const { locale, setLocale, t } = useMenuLocale();
  const { displayCurrency } = useMenuCurrency();
  const current = MENU_LOCALES.find((item) => item.code === locale) ?? MENU_LOCALES[0];
  const { open, setOpen, rootRef } = usePickerOpenState();

  const close = () => setOpen(false);
  const toggle = () => setOpen((value) => !value);

  const itemBaseClass =
    variant === "minimal"
      ? "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[0.75rem] font-medium uppercase tracking-[0.12em]"
      : "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[0.625rem] font-normal uppercase tracking-[0.12em]";

  const itemSelectedClass =
    "bg-[var(--lx-gold)] font-semibold text-[var(--lx-primary-fg)]";

  const itemIdleClass =
    "text-[var(--lx-fg)] hover:bg-[color-mix(in_oklch,var(--lx-gold)_12%,transparent)]";

  const panelProps: PanelProps = {
    onSelect: close,
    languageLabel: t.language,
    currencyLabel: t.currency,
    sectionLabelClass:
      variant === "minimal"
        ? "px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--lx-muted)]"
        : "px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[var(--lx-muted)]",
    dividerClass: "my-1 border-t border-[var(--lx-border)]",
    languageItemClass: (selected) =>
      cn(
        itemBaseClass,
        variant === "dropdown" && "rounded-lg px-3 py-2 text-xs font-semibold tracking-wide",
        selected ? itemSelectedClass : itemIdleClass,
      ),
    currencyItemClass: (selected) =>
      cn(
        itemBaseClass,
        variant === "dropdown" && "rounded-lg px-3 py-2 text-xs font-semibold tracking-wide",
        selected ? itemSelectedClass : itemIdleClass,
      ),
  };

  if (variant === "minimal") {
    return (
      <DropdownShell
        className={className}
        open={open}
        setOpen={setOpen}
        rootRef={rootRef}
        listLabel={t.languageAndCurrency}
        panelClassName="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[6.5rem] overflow-hidden rounded-lg border border-[var(--lx-border)] bg-[var(--lx-card)] p-1 shadow-lg"
        trigger={
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={t.selectLanguageAndCurrency}
            onClick={toggle}
            className="flex h-9 min-w-[3.25rem] items-center justify-center gap-1 whitespace-nowrap px-1.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)] transition-colors hover:text-[var(--lx-fg)]"
          >
            <span>{current.label}</span>
            <span aria-hidden className="opacity-40">
              |
            </span>
            <span>{displayCurrency}</span>
          </button>
        }
      >
        <LocaleCurrencyPanel {...panelProps} />
      </DropdownShell>
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownShell
        className={className}
        open={open}
        setOpen={setOpen}
        rootRef={rootRef}
        listLabel={t.languageAndCurrency}
        panelClassName="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--lx-border)] bg-[var(--lx-card)] p-1 shadow-xl"
        trigger={
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={toggle}
            aria-label={t.selectLanguageAndCurrency}
            className="flex h-10 min-w-10 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-[var(--lx-border)] px-2.5 text-xs font-semibold tracking-wide text-[var(--lx-fg)]"
          >
            <span>{current.label}</span>
            <span aria-hidden className="text-[var(--lx-muted)] opacity-70">
              |
            </span>
            <span>{displayCurrency}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-[var(--lx-muted)] transition", open && "rotate-180")} />
          </button>
        }
      >
        <LocaleCurrencyPanel {...panelProps} />
      </DropdownShell>
    );
  }

  return (
    <div
      className={
        className ??
        "flex flex-col items-center justify-center gap-2 rounded-full border border-border/70 bg-background/80 p-2 shadow-sm backdrop-blur"
      }
      role="group"
      aria-label={t.languageAndCurrency}
    >
      <div className="flex items-center gap-1.5">
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
      <div className="flex items-center gap-1">
        {MENU_DISPLAY_CURRENCIES.map((code) => {
          const selected = code === displayCurrency;
          return (
            <CurrencyGroupButton key={code} code={code} selected={selected} />
          );
        })}
      </div>
    </div>
  );
}

function CurrencyGroupButton({
  code,
  selected,
}: {
  code: (typeof MENU_DISPLAY_CURRENCIES)[number];
  selected: boolean;
}) {
  const { setDisplayCurrency, ensureRates } = useMenuCurrency();

  return (
    <button
      type="button"
      onClick={() => {
        void ensureRates();
        setDisplayCurrency(code);
      }}
      aria-pressed={selected}
      className={
        selected
          ? "min-w-10 rounded-full bg-foreground px-2 py-1 text-[0.65rem] font-bold tracking-wide text-background shadow"
          : "min-w-10 rounded-full px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      }
    >
      {code}
    </button>
  );
}
