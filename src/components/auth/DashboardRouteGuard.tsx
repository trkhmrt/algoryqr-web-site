"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { RequireScope } from "@/components/auth/RequireScope";
import { resolveRequiredScope } from "@/lib/dashboard-route-guards";

export function DashboardRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const requiredScope = resolveRequiredScope(pathname);
  if (!requiredScope) return children;
  return <RequireScope scope={requiredScope}>{children}</RequireScope>;
}
