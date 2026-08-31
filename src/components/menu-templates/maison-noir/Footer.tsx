"use client";

import type { MenuProfileApiItem } from "@/lib/api";

type MaisonNoirFooterProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "phone" | "email" | "address">;
};

export function MaisonNoirFooter({ menu }: MaisonNoirFooterProps) {
  const contact = [menu.phone, menu.address].filter(Boolean).join(" · ");

  return (
    <footer className="mt-auto px-8 pb-10 pt-4">
      <div className="mx-auto max-w-xl space-y-3 text-center">
        <div className="mn-hairline mx-auto w-24" />
        {contact ? (
          <p className="text-[0.6rem] tracking-[0.25em] text-[var(--mn-muted)]">{contact}</p>
        ) : null}
        <p className="text-[0.6rem] tracking-[0.25em] text-[var(--mn-muted)]/85">
          FİYATLAR TÜRK LİRASIDIR · SERVİS DAHİLDİR
        </p>
        <p className="text-[0.55rem] tracking-[0.2em] text-[var(--mn-muted)]/75">
          {menu.businessName} · Powered by AlgoryQR
        </p>
      </div>
    </footer>
  );
}
