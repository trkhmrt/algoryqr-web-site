"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, ClipboardList, Loader2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import {
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getUberEatsConnection } from "@/lib/ubereats-api";
import { importMenuFromUberEats, listPendingProducts } from "@/lib/ubereats-menu-api";
import {
  connectionStatusClass,
  connectionStatusLabel,
  UBER_EATS_SOFT_CARD_CLASS,
} from "@/lib/ubereats-ui";
import { cn } from "@/lib/utils";

export default function UberEatsMenuSyncView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const menusQuery = useDigitalMenuOptions(canUseDigitalMenu && !accessLoading);
  const menus = menusQuery.menuQrs;
  const [menuId, setMenuId] = useState<number | null>(null);
  const selectedMenuId = menuId ?? menus[0]?.menuId ?? null;

  const connectionQuery = useQuery({
    queryKey: ["ubereats-connection"],
    queryFn: () => getUberEatsConnection(),
    enabled: canUseDigitalMenu,
    retry: false,
  });

  const pendingQuery = useQuery({
    queryKey: ["uber-eats-pending-count", selectedMenuId],
    queryFn: () => listPendingProducts(selectedMenuId as number, { page: 0, size: 1 }),
    enabled: selectedMenuId != null && canUseDigitalMenu,
    retry: false,
  });

  const connection = connectionQuery.data;
  const isConnected = connection?.status === "CONNECTED";
  const pendingCount = pendingQuery.data?.totalElements ?? 0;
  const selectedMenu = useMemo(
    () => menus.find((item) => item.menuId === selectedMenuId),
    [menus, selectedMenuId],
  );

  const importMutation = useMutation({
    mutationFn: () => importMenuFromUberEats(selectedMenuId as number),
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: ["uber-eats-pending-count"] });
      notify("info", `İçe aktarım başladı. Job: ${job.jobId.slice(0, 8)}…`);
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "İçe aktarım başlatılamadı.");
    },
  });

  if (accessLoading || menusQuery.loading || (canUseDigitalMenu && connectionQuery.isLoading)) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={DASHBOARD_ROUTES.uberEats}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Uber Eats
      </Link>

      <IntegrationsSectionHeader
        brandDescription="Bağlı restoranın ürünlerini kendi menünüze aktarın."
        pageTitle="Menü senkronu"
        pageDescription="Ürünler onay sonrası kendi menünüze yazılır"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bağlantı durumu</p>
          <div className="mt-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                connectionStatusClass(connection?.status),
              )}
            >
              {connectionStatusLabel(connection?.status)}
            </span>
          </div>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Restoran</p>
          <p className="mt-1 truncate text-xl font-semibold">
            {connection?.restaurantName || connection?.restaurantId || "Seçilmedi"}
          </p>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Onay bekleyen</p>
          <p className="mt-1 text-xl font-semibold">{pendingCount}</p>
        </div>
      </div>

      {!isConnected ? (
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} space-y-3 p-5`}>
          <p className="text-sm text-muted-foreground">
            Menü senkronu için önce Uber Eats restoran bağlantısını kurun.
          </p>
          <Button asChild>
            <Link href={DASHBOARD_ROUTES.uberEats}>Bağlantı ayarlarına git</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={DASHBOARD_ROUTES.uberEatsPending}
          className={`group flex items-center justify-between ${UBER_EATS_SOFT_CARD_CLASS} p-5 transition-colors hover:border-primary/30`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Onay bekleyen ürünler</p>
              <p className="text-xs text-muted-foreground">İncele, düzenle, onayla veya reddet</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href={DASHBOARD_ROUTES.uberEatsOrders}
          className={`group flex items-center justify-between ${UBER_EATS_SOFT_CARD_CLASS} p-5 transition-colors hover:border-primary/30`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Siparişler</p>
              <p className="text-xs text-muted-foreground">Gelen Uber Eats siparişlerini yönetin</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className={`${UBER_EATS_SOFT_CARD_CLASS} space-y-4 p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="uber-menu">Hedef menü</Label>
            <select
              id="uber-menu"
              className="flex h-10 w-full min-w-[16rem] rounded-md border border-input bg-background px-3 text-sm"
              value={selectedMenuId ?? ""}
              onChange={(event) => setMenuId(Number(event.target.value) || null)}
            >
              {menus.map((menu) => (
                <option key={menu.menuId} value={menu.menuId ?? ""}>
                  {menu.name}
                </option>
              ))}
            </select>
            {selectedMenu ? (
              <p className="text-xs text-muted-foreground">Menü #{selectedMenu.menuId}</p>
            ) : null}
          </div>
          <Button
            type="button"
            disabled={selectedMenuId == null || !isConnected || importMutation.isPending}
            onClick={() => importMutation.mutate()}
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Uber’den içe aktar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Aktarılan ürünler doğrudan yayına girmez; önce onay bekleyenler ekranına düşer.
        </p>
      </div>
    </div>
  );
}
