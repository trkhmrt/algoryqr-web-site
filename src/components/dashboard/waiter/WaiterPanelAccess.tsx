"use client";

import { useRequireScope } from "@/components/auth/RequireScope";

export function useWaiterPanelAccess() {
  const { allowed, isLoading } = useRequireScope("WAITER_PANEL_OWNER");
  return {
    accessLoading: isLoading,
    canUseWaiterPanel: allowed,
  };
}
