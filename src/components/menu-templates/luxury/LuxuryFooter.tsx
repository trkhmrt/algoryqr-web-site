"use client";

import { Mail, MapPin, Phone } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";

import { usePublicMenuTheme } from "../shared/public-menu-theme";

type LuxuryFooterProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "phone" | "email" | "address">;
};

export function LuxuryFooter({ menu }: LuxuryFooterProps) {
  const { footerKicker } = usePublicMenuTheme();
  return (
    <footer className="menu-footer mt-auto border-t border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-bg)_96%,black)]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-lg font-semibold text-gradient-gold">{menu.businessName}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] lx-muted">{footerKicker}</p>
        </div>
        <div className="space-y-2 text-sm lx-muted">
          {menu.address ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 lx-gold" />
              <span>{menu.address}</span>
            </p>
          ) : null}
          {menu.phone ? (
            <a href={`tel:${menu.phone}`} className="flex items-center gap-2 hover:text-[var(--lx-fg)]">
              <Phone className="h-4 w-4 shrink-0 lx-gold" />
              {menu.phone}
            </a>
          ) : null}
          {menu.email ? (
            <a href={`mailto:${menu.email}`} className="flex items-center gap-2 break-all hover:text-[var(--lx-fg)]">
              <Mail className="h-4 w-4 shrink-0 lx-gold" />
              {menu.email}
            </a>
          ) : null}
        </div>
        <p className="text-xs lx-muted sm:col-span-2 lg:col-span-1 lg:text-right">
          © {new Date().getFullYear()} {menu.businessName}
          <span className="mt-2 block">
            AlgoryCode tarafından yapılmıştır.{" "}
            <a
              href="https://www.algorycode.com"
              target="_blank"
              rel="noopener noreferrer"
              className="lx-gold underline-offset-2 hover:underline"
            >
              www.algorycode.com
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}
