"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Package, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useBranches } from "@/hooks/use-branches";
import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  disconnectTrendyolGo,
  getTrendyolGoConnection,
  listTrendyolGoRestaurants,
  upsertTrendyolGoConnection,
  type TrendyolGoConnection,
} from "@/lib/trendyol-go-api";
import {
  connectionStatusClass,
  connectionStatusLabel,
  formatTrendyolGoDateTime,
  shortDisplayId,
  TGO_SOFT_CARD_CLASS,
  TGO_SOFT_FIELD_CLASS,
} from "@/lib/trendyol-go-ui";
import { cn } from "@/lib/utils";

function SummaryField({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className={TGO_SOFT_FIELD_CLASS} title={title}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function TrendyolGoHubView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchesQuery = useBranches(canUseDigitalMenu && !accessLoading);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(null);
  const selectedBranchId = branchId ?? branches[0]?.id ?? null;
  const [sellerId, setSellerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const connectionQuery = useQuery({
    queryKey: ["tgo-connection", selectedBranchId],
    queryFn: () => getTrendyolGoConnection(selectedBranchId as number),
    enabled: selectedBranchId != null && canUseDigitalMenu,
    retry: false,
  });

  const restaurantsQuery = useQuery({
    queryKey: ["tgo-restaurants", selectedBranchId],
    queryFn: () => listTrendyolGoRestaurants(selectedBranchId as number),
    enabled:
      selectedBranchId != null &&
      (connectionQuery.data?.status === "PENDING_RESTAURANT" ||
        connectionQuery.data?.status === "CONNECTED"),
    retry: false,
  });

  const connection = connectionQuery.data;
  const restaurants = restaurantsQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      if (selectedBranchId == null) throw new Error("Şube seçin");
      return upsertTrendyolGoConnection({
        branchId: selectedBranchId,
        sellerId: sellerId || connectionQuery.data?.sellerId || "",
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        restaurantId: restaurantId || connectionQuery.data?.restaurantId || undefined,
      });
    },
    onSuccess: async (saved: TrendyolGoConnection) => {
      setApiKey("");
      setApiSecret("");
      await queryClient.invalidateQueries({ queryKey: ["tgo-connection"] });
      await queryClient.invalidateQueries({ queryKey: ["tgo-restaurants"] });
      notify("info", saved.status === "CONNECTED" ? "Restoran bağlandı." : "Kimlik kaydedildi. Restoran seçin.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Bağlantı kaydedilemedi.");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectTrendyolGo(selectedBranchId as number),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tgo-connection"] });
      notify("info", "Uber Eats bağlantısı kapatıldı.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Bağlantı kapatılamadı.");
    },
  });

  if (accessLoading || branchesQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={DASHBOARD_ROUTES.integrations}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Entegrasyonlar
      </Link>

      <IntegrationsSectionHeader />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bağlantı durumu</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${connectionStatusClass(connection?.status)}`}
            >
              {connectionStatusLabel(connection?.status)}
            </span>
          </div>
        </div>
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Restoran</p>
          <p className="mt-1 text-xl font-semibold truncate">
            {connection?.restaurantName || "Seçilmedi"}
          </p>
        </div>
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Son senkron</p>
          <p className="mt-1 text-xl font-semibold">
            {formatTrendyolGoDateTime(connection?.lastSyncedAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={DASHBOARD_ROUTES.uberEatsProducts}
          className={`group flex items-center justify-between ${TGO_SOFT_CARD_CLASS} p-5 transition-colors hover:border-primary/30`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Ürünler</p>
              <p className="text-xs text-muted-foreground">Partner menüsündeki ürünler</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href={DASHBOARD_ROUTES.uberEatsOrders}
          className={`group flex items-center justify-between ${TGO_SOFT_CARD_CLASS} p-5 transition-colors hover:border-primary/30`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Siparişler</p>
              <p className="text-xs text-muted-foreground">Gelen siparişleri yönetin</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div className={TGO_SOFT_CARD_CLASS}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 p-5 text-left sm:p-6"
            >
              <div>
                <h2 className="text-base font-semibold text-foreground">Bağlantı ayarları</h2>
                <p className="text-xs text-muted-foreground">
                  Şube bazında Uber Eats kimlik bilgilerinizi tanımlayın.
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  settingsOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="space-y-4 border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Şube</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedBranchId ?? ""}
              onChange={(event) => {
                const next = Number(event.target.value);
                setBranchId(Number.isFinite(next) ? next : null);
                setRestaurantId("");
              }}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {connection ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryField label="Şube" value={selectedBranch?.name ?? "—"} />
              <SummaryField
                label="Satıcı kimliği"
                value={shortDisplayId(connection.sellerId, 12)}
                title={connection.sellerId}
              />
              {connection.apiKeyMasked ? (
                <SummaryField label="API anahtarı" value={connection.apiKeyMasked} />
              ) : null}
              {connection.restaurantId ? (
                <SummaryField
                  label="Restoran kimliği"
                  value={shortDisplayId(connection.restaurantId)}
                  title={connection.restaurantId}
                />
              ) : null}
            </div>
          ) : null}

          {connection?.lastError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {connection.lastError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Satıcı ID</Label>
              <Input
                value={sellerId || connection?.sellerId || ""}
                onChange={(event) => setSellerId(event.target.value)}
                placeholder="Satıcı numarası"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">API anahtarı</Label>
              <Input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={connection?.apiKeyMasked ? "Değiştirmek için yeni anahtar" : "API anahtarı"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">API gizli anahtarı</Label>
            <Input
              type="password"
              value={apiSecret}
              onChange={(event) => setApiSecret(event.target.value)}
              placeholder="API gizli anahtarı"
            />
          </div>

          {restaurants.length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Restoran</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={restaurantId || connection?.restaurantId || ""}
                onChange={(event) => setRestaurantId(event.target.value)}
              >
                <option value="">Restoran seçin</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name || shortDisplayId(restaurant.id)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedBranchId}>
              {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet / bağla"}
            </Button>
            {connection ? (
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                Bağlantıyı kapat
              </Button>
            ) : null}
          </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
