"use client";

import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import { useMenuLocaleOptional } from "./menu-locale";
import { useOrderingOptional } from "./ordering-context";
import { usePublicMenuTheme } from "./public-menu-theme";

type TableBadgeProps = {
  variant?: "fixed" | "inline";
  className?: string;
};

const INLINE_NAV_THEMES = new Set(["maison-noir", "modern-bistro", "kahve-sokagi"]);

export function TableBadge({ variant = "fixed", className }: TableBadgeProps) {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const theme = usePublicMenuTheme();

  if (!ordering?.tableName) return null;
  if (variant === "fixed" && INLINE_NAV_THEMES.has(theme.id)) return null;

  const label = locale?.t.tableLabel ?? "Masa";
  const pill = (
    <div
      className={cn(
        "inline-flex max-w-[7.5rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        variant === "inline"
          ? "border-current/15 bg-current/[0.06]"
          : "border-border bg-background/95 text-foreground shadow-sm backdrop-blur-sm",
        className,
      )}
      title={`${label}: ${ordering.tableName}`}
    >
      <MapPin className="h-3 w-3 shrink-0 opacity-55" aria-hidden />
      <span className="truncate">
        {label}: {ordering.tableName}
      </span>
    </div>
  );

  if (variant === "inline") {
    return pill;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-[3.35rem] z-[45] -translate-x-1/2">
      {pill}
    </div>
  );
}
