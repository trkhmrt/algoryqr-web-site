"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAccessProfile } from "@/hooks/use-access-profile";
import { usePaymentMethods, useTrialStatus } from "@/hooks/use-commerce";
import { useOverviewOpsStats } from "@/hooks/use-overview-ops-stats";
import { useSubscription } from "@/hooks/use-subscription";
import { hasScope } from "@/lib/auth-user";
import { buildSetupSteps, isSetupComplete, nextSetupStep } from "@/lib/dashboard-setup";
import { isActivePaidPurchase } from "@/lib/product-access";

export function SetupNextBanner() {
  const pathname = usePathname();
  const { data: accessProfile, isLoading: accessLoading } = useAccessProfile();
  const showMenus = hasScope(accessProfile, "QR_MENU_OWNER");
  const cards = usePaymentMethods({ enabled: !accessLoading });
  const trial = useTrialStatus(!accessLoading);
  const subscription = useSubscription();
  const hasActiveSubscription = isActivePaidPurchase(subscription.data?.activePurchase ?? null);
  const stats = useOverviewOpsStats({
    orders: false,
    reservations: false,
    menus: showMenus,
  });

  if (
    accessLoading ||
    cards.isLoading ||
    stats.loading ||
    trial.isLoading ||
    subscription.isLoading ||
    cards.isError
  ) {
    return null;
  }

  const steps = buildSetupSteps({
    hasCard: (cards.data?.length ?? 0) > 0,
    canOperate: trial.data?.status === "ACTIVE" || showMenus || hasActiveSubscription,
    hasActiveSubscription,
    branchCount: stats.branchCount,
    totalMenus: stats.totalMenus,
    liveMenus: stats.liveMenus,
  });
  if (isSetupComplete(steps)) {
    return null;
  }
  const next = nextSetupStep(steps);
  if (next == null) {
    return null;
  }
  if (pathname === next.href || pathname.startsWith(`${next.href}?`)) {
    return null;
  }
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground">
        Sıradaki: <span className="font-semibold">{next.label}</span>
        <span className="text-muted-foreground"> · {next.hint}</span>
      </p>
      <Link
        href={next.href}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Devam et
      </Link>
    </div>
  );
}
