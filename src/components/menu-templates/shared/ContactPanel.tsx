"use client";

import { Mail, MapPin, Phone } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";

type ContactPanelProps = {
  menu: MenuProfileApiItem;
  className?: string;
  itemClassName?: string;
};

export function ContactPanel({ menu, className, itemClassName }: ContactPanelProps) {
  const hasAny = Boolean(menu.phone || menu.email || menu.address);

  return (
    <div className={className ?? "space-y-3 px-4 py-4"}>
      <h2 className="font-display text-2xl font-semibold text-gradient-gold">İletişim</h2>
      {!hasAny ? (
        <p className="text-sm text-muted-foreground">İletişim bilgisi henüz eklenmemiş.</p>
      ) : (
        <div className="space-y-2">
          {menu.phone ? (
            <a
              href={`tel:${menu.phone}`}
              className={
                itemClassName ??
                "flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm"
              }
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span>{menu.phone}</span>
            </a>
          ) : null}
          {menu.email ? (
            <a
              href={`mailto:${menu.email}`}
              className={
                itemClassName ??
                "flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm"
              }
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{menu.email}</span>
            </a>
          ) : null}
          {menu.address ? (
            <div
              className={
                itemClassName ??
                "flex items-start gap-3 rounded-xl border border-border px-3 py-3 text-sm"
              }
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{menu.address}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
