"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Loader2,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import {
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  disconnectUberEats,
  exportMenuToUberEats,
  getUberEatsConnection,
  importMenuFromUberEats,
  listPendingProducts,
  upsertUberEatsConnection,
  type UberEatsConnectionStatus,
} from "@/lib/ubereats-menu-api";
import { UBER_EATS_SOFT_CARD_CLASS, UBER_EATS_SOFT_FIELD_CLASS } from "@/lib/ubereats-ui";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<UberEatsConnectionStatus, string> = {
  DISCONNECTED: "Bağlı değil",
  CONNECTED: "Bağlı",
  ERROR: "Hata",
};

const STATUS_CLASS: Record<UberEatsConnectionStatus, string> = {
  DISCONNECTED: "bg-muted text-muted-foreground",
  CONNECTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ERROR: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

export default function UberEatsMenuSyncView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const menusQuery = useDigitalMenuOptions(canUseDigitalMenu && !accessLoading);
  const menus = menusQuery.menuQrs;
  const [menuId, setMenuId] = useState<number | null>(null);
  const selectedMenuId = menuId ?? menus[0]?.menuId ?? null;
  const [storeId, setStoreId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const connectionQuery = useQuery({
    queryKey: ["uber-eats-connection", selectedMenuId],
    queryFn: () => getUberEatsConnection(selectedMenuId as number),
    enabled: selectedMenuId != null && canUseDigitalMenu,
    retry: false,
  });

  const pendingQuery = useQuery({
    queryKey: ["uber-eats-pending-count", selectedMenuId],
    queryFn: () => listPendingProducts(selectedMenuId as number, { page: 0, size: 1 }),
    enabled: selectedMenuId != null && canUseDigitalMenu,
    retry: false,
  });

  const connection = connectionQuery.data;
  const pendingCount = pendingQuery.data?.totalElements ?? 0;
  const selectedMenu = useMemo(
    () => menus.find((item) => item.menuId === selectedMenuId),
    [menus, selectedMenuId],
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      if (selectedMenuId == null) throw new Error("Menü seçin");
      return upsertUberEatsConnection({
        menuId: selectedMenuId,
        storeId: storeId || connection?.storeId || "",
        clientId: clientId || undefined,
        clientSecret: clientSecret || undefined,
      });
    },
    onSuccess: async () => {
      setClientId("");
      setClientSecret("");
      await queryClient.invalidateQueries({ queryKey: ["uber-eats-connection"] });
      notify("info", "Uber Eats bağlantısı kaydedildi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Bağlantı kaydedilemedi.");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectUberEats(selectedMenuId as number),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["uber-eats-connection"] });
      notify("info", "Uber Eats bağlantısı kapatıldı.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Bağlantı kapatılamadı.");
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportMenuToUberEats(selectedMenuId as number),
    onSuccess: (job) => {
      notify("info", `Dışa aktarım başladı. Job: ${job.jobId.slice(0, 8)}…`);
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Dışa aktarım başlatılamadı.");
    },
  });

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

  if (accessLoading || menusQuery.loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  const status = connection?.status ?? "DISCONNECTED";

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={DASHBOARD_ROUTES.integrations}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Entegrasyonlar
      </Link>

      <IntegrationsSectionHeader
        brandDescription="Menü senkronu, onay akışı ve Uber mağaza bağlantısını buradan yönetin."
        pageTitle="Menü senkronu"
        pageDescription="Ürünleri onay sonrası kendi menünüze veya Uber Eats’e aktarın"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bağlantı durumu</p>
          <div className="mt-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                STATUS_CLASS[status],
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Mağaza</p>
          <p className="mt-1 truncate text-xl font-semibold">{connection?.storeId || "Seçilmedi"}</p>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Onay bekleyen</p>
          <p className="mt-1 text-xl font-semibold">{pendingCount}</p>
        </div>
      </div>

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
            <Label htmlFor="uber-menu">Menü</Label>
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={selectedMenuId == null || status !== "CONNECTED" || exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Menüyü Uber’e aktar
            </Button>
            <Button
              type="button"
              disabled={selectedMenuId == null || status !== "CONNECTED" || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Uber’den içe aktar
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Aktarılan ürünler doğrudan yayına girmez; önce onay bekleyenler ekranına düşer.
        </p>
      </div>

      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div className={UBER_EATS_SOFT_CARD_CLASS}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="font-medium">Bağlantı ayarları</p>
                <p className="text-xs text-muted-foreground">Store ID ve OAuth kimlik bilgileri</p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", settingsOpen && "rotate-180")}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 border-t border-border/60 px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className={UBER_EATS_SOFT_FIELD_CLASS}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Client ID</p>
                <p className="mt-0.5 text-sm font-medium">
                  {connection?.clientIdMasked || "—"}
                </p>
              </div>
              <div className={UBER_EATS_SOFT_FIELD_CLASS}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Store ID</p>
                <p className="mt-0.5 text-sm font-medium">{connection?.storeId || "—"}</p>
              </div>
              <div className={UBER_EATS_SOFT_FIELD_CLASS}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Durum</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium">
                  {status === "CONNECTED" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
                  {STATUS_LABEL[status]}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="uber-store-id">Store ID</Label>
                <Input
                  id="uber-store-id"
                  value={storeId}
                  placeholder={connection?.storeId || "Uber store_id"}
                  onChange={(event) => setStoreId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uber-client-id">Client ID</Label>
                <Input
                  id="uber-client-id"
                  value={clientId}
                  placeholder="Yeni client id"
                  onChange={(event) => setClientId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uber-client-secret">Client Secret</Label>
                <Input
                  id="uber-client-secret"
                  type="password"
                  value={clientSecret}
                  placeholder="Yeni client secret"
                  onChange={(event) => setClientSecret(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={selectedMenuId == null || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Kaydet ve doğrula
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={selectedMenuId == null || !connection || disconnectMutation.isPending}
                onClick={() => disconnectMutation.mutate()}
              >
                Bağlantıyı kes
              </Button>
            </div>
            {connection?.lastError ? (
              <p className="text-sm text-destructive">{connection.lastError}</p>
            ) : null}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
