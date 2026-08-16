"use client";

import type { MenuProfileApiItem } from "@/lib/api";

type ModernBistroFooterProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "phone" | "email" | "address">;
};

export function ModernBistroFooter({ menu }: ModernBistroFooterProps) {
  return (
    <footer className="mt-auto border-t border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--mb-muted)]">{menu.businessName}</p>
          {(menu.phone || menu.address) && (
            <p className="mt-1 text-xs text-[var(--mb-muted)]">
              {[menu.phone, menu.address].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <p className="text-[11px] text-[var(--mb-muted)]">Powered by AlgoryQR</p>
      </div>
    </footer>
  );
}
