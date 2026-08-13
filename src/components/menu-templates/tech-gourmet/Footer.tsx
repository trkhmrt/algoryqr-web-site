"use client";

import type { MenuProfileApiItem } from "@/lib/api";

type TechGourmetFooterProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "phone" | "email" | "address">;
};

export function TechGourmetFooter({ menu }: TechGourmetFooterProps) {
  return (
    <footer
      className="mt-auto px-4 py-6 sm:px-6"
      style={{
        backgroundColor: "var(--tg-surface-low)",
        borderTop: "1px solid var(--tg-outline-variant)",
      }}
    >
      <div className="mx-auto max-w-6xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
          >
            SYS.FOOTER — {menu.businessName}
          </p>
          {(menu.phone || menu.address) && (
            <p
              className="mt-1 text-xs"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
            >
              {[menu.phone, menu.address].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <p
          className="text-xs"
          style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-outline)" }}
        >
          POWERED BY ALGORY
        </p>
      </div>
    </footer>
  );
}
