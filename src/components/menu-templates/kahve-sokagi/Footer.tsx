"use client";

import { Mail, MapPin, Phone } from "lucide-react";

import type { MenuProfileApiItem } from "@/lib/api";

import { usePublicMenuTheme } from "../shared/public-menu-theme";

type FooterProps = {
  menu: Pick<MenuProfileApiItem, "phone" | "email" | "address">;
};

export function KahveSokagiFooter({ menu }: FooterProps) {
  const { footerKicker } = usePublicMenuTheme();
  const hasContact = Boolean(menu.address || menu.phone || menu.email);

  return (
    <footer className="menu-footer mt-auto border-t border-[var(--lx-border)] pb-20">
      <div className="mx-auto max-w-[480px] px-4 py-7">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ks-secondary)]">
          {footerKicker}
        </p>
        {hasContact ? (
          <div className="mt-4 space-y-2 text-center text-sm text-[var(--lx-muted)]">
            {menu.address ? (
              <p className="flex items-start justify-center gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ks-secondary)]" />
                <span>{menu.address}</span>
              </p>
            ) : null}
            {menu.phone ? (
              <a
                href={`tel:${menu.phone}`}
                className="inline-flex items-center gap-2 hover:text-[var(--lx-fg)]"
              >
                <Phone className="h-4 w-4 shrink-0 text-[var(--ks-secondary)]" />
                {menu.phone}
              </a>
            ) : null}
            {menu.email ? (
              <a
                href={`mailto:${menu.email}`}
                className="flex items-center justify-center gap-2 break-all hover:text-[var(--lx-fg)]"
              >
                <Mail className="h-4 w-4 shrink-0 text-[var(--ks-secondary)]" />
                {menu.email}
              </a>
            ) : null}
          </div>
        ) : null}
        <p className="mt-5 text-center text-xs text-[var(--lx-muted)]">
          AlgoryCode ·{" "}
          <a
            href="https://www.algorycode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ks-secondary)] underline-offset-2 hover:underline"
          >
            www.algorycode.com
          </a>
        </p>
      </div>
    </footer>
  );
}
