"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type SlidingTabItem = {
  value: string;
  label: string;
  href?: string;
  disabled?: boolean;
  icon?: ReactNode;
};

export type SlidingTabSelectSize = "sm" | "md" | "lg";
export type SlidingTabSelectVariant = "pill" | "line" | "nav" | "soft";

const SIZE_STYLES: Record<
  SlidingTabSelectSize,
  { track: string; item: string; icon: string }
> = {
  sm: { track: "p-1 gap-1", item: "h-7 px-3 text-xs", icon: "h-3.5 w-3.5" },
  md: { track: "p-1 gap-1", item: "h-9 px-3.5 text-sm", icon: "h-4 w-4" },
  lg: { track: "p-1.5 gap-1.5", item: "h-10 px-4 text-sm", icon: "h-4 w-4" },
};

const VARIANT_STYLES: Record<
  SlidingTabSelectVariant,
  { track: string; item: string; activeText: string; inactiveText: string; indicator: string }
> = {
  pill: {
    track: "inline-flex rounded-lg border border-border bg-card",
    item: "rounded-md",
    activeText: "text-primary-foreground",
    inactiveText: "text-muted-foreground hover:text-foreground",
    indicator: "absolute inset-0 rounded-md bg-primary",
  },
  line: {
    track: "flex w-full gap-0 rounded-none border-0 border-b border-border bg-transparent p-0",
    item: "rounded-none px-4",
    activeText: "text-foreground",
    inactiveText: "text-muted-foreground hover:text-foreground",
    indicator: "absolute inset-x-0 bottom-0 h-0.5 bg-foreground",
  },
  nav: {
    track: "flex w-full gap-1.5 border-0 bg-transparent p-0",
    item: "flex-1 rounded-lg border bg-white px-3 py-2.5 text-center text-xs sm:text-sm dark:bg-card",
    activeText: "border-transparent text-foreground",
    inactiveText: "border-border/70 text-muted-foreground hover:text-foreground",
    indicator: "absolute inset-0 rounded-lg bg-muted",
  },
  soft: {
    track: "inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1",
    item: "rounded-xl px-3 py-1.5 text-xs",
    activeText: "text-foreground",
    inactiveText: "text-muted-foreground hover:bg-background/70 hover:text-foreground",
    indicator: "absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-border/70",
  },
};

type SlidingTabSelectProps = {
  items: SlidingTabItem[];
  value: string;
  onValueChange?: (value: string) => void;
  size?: SlidingTabSelectSize;
  variant?: SlidingTabSelectVariant;
  className?: string;
  ariaLabel?: string;
};

export function SlidingTabSelect({
  items,
  value,
  onValueChange,
  size = "sm",
  variant = "pill",
  className,
  ariaLabel,
}: SlidingTabSelectProps) {
  const layoutId = `sliding-tab-${useId()}`;
  const sizes = SIZE_STYLES[size];
  const look = VARIANT_STYLES[variant];

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("relative items-center", look.track, variant === "pill" && sizes.track, className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        const sharedClassName = cn(
          "relative isolate inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200",
          variant !== "nav" && variant !== "soft" && sizes.item,
          look.item,
          active ? look.activeText : look.inactiveText,
          item.disabled && "pointer-events-none opacity-50",
        );
        const content = (
          <>
            {active ? (
              <motion.span
                layoutId={layoutId}
                className={look.indicator}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            {item.icon ? <span className={cn("relative z-10", sizes.icon)}>{item.icon}</span> : null}
            <span className="relative z-10">{item.label}</span>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.value}
              href={item.href}
              role="tab"
              aria-selected={active}
              aria-disabled={item.disabled}
              className={sharedClassName}
              onClick={() => {
                if (!item.disabled) onValueChange?.(item.value);
              }}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            className={sharedClassName}
            onClick={() => onValueChange?.(item.value)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
