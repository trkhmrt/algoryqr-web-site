"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { DigitalMenuHubShell } from "@/components/dashboard/digital-menu/DigitalMenuHubShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { useBranches } from "@/hooks/use-branches";
import { formatBranchCreateQuota } from "@/lib/branch";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export function DigitalMenuBranchesPanel() {
  const router = useRouter();
  const branchesQuery = useBranches(true);
  const branches = branchesQuery.data?.content ?? [];
  const canCreateBranch = Boolean(branchesQuery.data?.quota.canCreate);
  const branchQuotaLabel = formatBranchCreateQuota(branchesQuery.data?.quota);

  return (
    <DigitalMenuHubShell
      title="Şubeler"
      hint={branchQuotaLabel}
      action={
        <Button
          onClick={() =>
            router.push(
              canCreateBranch
                ? DASHBOARD_ROUTES.branchCreate
                : DASHBOARD_ROUTES.catalogProductCheckout("QR_BRANCH"),
            )
          }
        >
          {canCreateBranch ? "Şube oluştur" : "Hak satın al"}
        </Button>
      }
    >
      {branchesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Şubeler yükleniyor…
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          title="Henüz şube yok"
          description="İlk şubenizi oluşturup menü ve QR bağlamaya başlayın."
          action={
            <Button
              onClick={() =>
                router.push(
                  canCreateBranch
                    ? DASHBOARD_ROUTES.branchCreate
                    : DASHBOARD_ROUTES.catalogProductCheckout("QR_BRANCH"),
                )
              }
            >
              {canCreateBranch ? "İlk şubeyi oluştur" : "Hak satın al"}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={DASHBOARD_ROUTES.branchSettings(branch.id)}
              className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none transition-colors hover:bg-muted/50 dark:border-border dark:bg-card"
            >
              {branch.photoUrl ? (
                <img
                  src={branch.photoUrl}
                  alt=""
                  className="h-14 w-14 rounded-lg border border-border object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted/40 text-lg font-medium text-muted-foreground">
                  {branch.name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}
                </span>
              )}
              <span className="line-clamp-2 text-center text-sm font-medium text-foreground">
                {branch.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </DigitalMenuHubShell>
  );
}
