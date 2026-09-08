"use client";

import { MapPin } from "lucide-react";

import { useMenuLocaleOptional } from "./menu-locale";
import { useOrderingOptional } from "./ordering-context";

export function TableBadge() {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();

  if (!ordering?.tableName) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[70] -translate-x-1/2">
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">
        <MapPin className="h-3 w-3 shrink-0 opacity-60" />
        <span>
          {locale?.t.tableLabel ?? "Masa"}: {ordering.tableName}
        </span>
      </div>
    </div>
  );
}
