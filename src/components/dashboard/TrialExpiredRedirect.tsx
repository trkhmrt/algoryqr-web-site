"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTrialStatus } from "@/hooks/use-commerce";
import { useSubscription } from "@/hooks/use-subscription";
import {
  isTrialExpiredAllowlistedPath,
  shouldForceTrialExpiredGate,
} from "@/lib/trial-expired-gate";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { isActivePaidPurchase } from "@/lib/product-access";

export default function TrialExpiredRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const trial = useTrialStatus();
  const subscription = useSubscription();

  useEffect(() => {
    if (trial.isLoading || subscription.isLoading) return;
    if (isTrialExpiredAllowlistedPath(pathname)) return;
    if (trial.isError) return;

    const hasActivePaid = isActivePaidPurchase(subscription.data?.activePurchase ?? null);
    if (!shouldForceTrialExpiredGate(trial.data?.status, hasActivePaid)) return;

    router.replace(DASHBOARD_ROUTES.trialExpired);
  }, [
    pathname,
    router,
    subscription.data?.activePurchase,
    subscription.isLoading,
    trial.data?.status,
    trial.isError,
    trial.isLoading,
  ]);

  return null;
}
