"use client";

import type { MenuProfileApiItem } from "@/lib/api";

type CleverDishScribeFooterProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "phone" | "email" | "address">;
};

export function CleverDishScribeFooter({ menu }: CleverDishScribeFooterProps) {
  return (
    <footer className="mt-auto border-t border-[var(--cds-border)] bg-[var(--cds-bg)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--cds-muted)]">{menu.businessName}</p>
          {(menu.phone || menu.address) && (
            <p className="mt-1 text-xs text-[var(--cds-muted)]">
              {[menu.phone, menu.address].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <p className="text-[11px] text-[var(--cds-muted)]">Powered by AlgoryQR</p>
      </div>
    </footer>
  );
}
