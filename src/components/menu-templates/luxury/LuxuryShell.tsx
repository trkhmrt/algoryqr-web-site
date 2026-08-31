import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";

import { LuxurySiteLayout } from "./LuxurySiteLayout";

type LuxuryShellProps = {
  menu: Pick<MenuProfileApiItem, "businessName" | "logoUrl" | "phone" | "email" | "address" | "qrId">;
  children: ReactNode;
};

export function LuxuryShell({ menu, children }: LuxuryShellProps) {
  return <LuxurySiteLayout menu={menu}>{children}</LuxurySiteLayout>;
}
