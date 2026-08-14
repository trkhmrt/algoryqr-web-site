"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useAccessProfile } from "@/hooks/use-access-profile";
import { hasScope, type ProductScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export function useWaiterPanelAccess() {
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const canUseWaiterPanel = hasScope(accessProfile, "WAITER_PANEL_OWNER");

  return {
    accessLoading,
    canUseWaiterPanel,
  };
}

export function navItemHasScope(
  requiredScope: ProductScope | undefined,
  scopes: ProductScope[],
): boolean {
  if (!requiredScope) return true;
  return scopes.includes(requiredScope);
}

export function WaiterPanelGate({
  accessLoading,
  canUse,
  children,
}: {
  accessLoading: boolean;
  canUse: boolean;
  children: ReactNode;
}) {
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!canUse) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Garson paneli ve sipariş modülü Ultimate pakette sunulur.
        </p>
        <Link
          href={DASHBOARD_ROUTES.accountPackages}
          className="inline-flex text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          Paketleri incele
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
