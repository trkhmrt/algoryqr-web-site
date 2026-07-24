"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatDaysUntilExpiry } from "@/lib/package-display";
import { isDateUsablePurchase } from "@/lib/product-access";
import { cn } from "@/lib/utils";

export default function TrialStatusBanner() {
  const pathname = usePathname();
  const { data, isLoading } = useSubscription();
  const active = data?.activePurchase;
  const isActiveTrial =
    !!active &&
    active.purchaseType === "TRIAL" &&
    isDateUsablePurchase(active);

  if (
    isLoading ||
    !isActiveTrial ||
    !active ||
    pathname.startsWith(DASHBOARD_ROUTES.accountSubscription)
  ) {
    return null;
  }

  const days = active.daysUntilExpiry;
  const urgent = typeof days === "number" && days <= 3;

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        urgent
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-emerald-500/25 bg-emerald-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <Clock3 className={cn("mt-0.5 h-4 w-4 shrink-0", urgent ? "text-amber-600" : "text-emerald-600")} />
        <div>
          <p className="text-sm font-medium text-foreground">
            {active.packageName} denemeniz aktif
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDaysUntilExpiry(days)}
            {active.expiresAt
              ? ` · ${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(new Date(active.expiresAt))} tarihinde biter`
              : ""}
            . Devam etmek için ücretli pakete geçebilirsiniz.
          </p>
        </div>
      </div>
      <Button asChild size="sm" variant={urgent ? "hero" : "outline"} className="shrink-0">
        <Link href={DASHBOARD_ROUTES.accountPackages}>Pakete geç</Link>
      </Button>
    </div>
  );
}
