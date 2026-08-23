"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useBranches } from "@/hooks/use-branches";
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

function statusLabel(status?: string) {
  switch (status) {
    case "CONNECTED":
      return "Bağlı";
    case "PENDING_RESTAURANT":
      return "Restoran seçin";
    case "ERROR":
      return "Hata";
    default:
      return "Bağlı değil";
  }
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
      notify("info", "TGO bağlantısı kapatıldı.");
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trendyol Go</h1>
        <p className="text-sm text-muted-foreground">
          Uber Eats Trendyol Go Yemek hesabınızdaki ürünleri görün ve siparişleri takip edin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href={DASHBOARD_ROUTES.trendyolGoProducts}>Ürünler</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={DASHBOARD_ROUTES.trendyolGoOrders}>Siparişler</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Şube</Label>
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
            <p className="text-sm text-muted-foreground">
              Durum: {statusLabel(connection.status)}
              {connection.restaurantName ? ` · ${connection.restaurantName}` : ""}
              {connection.apiKeyMasked ? ` · key ${connection.apiKeyMasked}` : ""}
            </p>
          ) : null}
          {connection?.lastError ? (
            <p className="text-sm text-destructive">{connection.lastError}</p>
          ) : null}

          <div className="space-y-2">
            <Label>Seller ID</Label>
            <Input
              value={sellerId || connection?.sellerId || ""}
              onChange={(event) => setSellerId(event.target.value)}
              placeholder="TGO seller / supplier id"
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={connection?.apiKeyMasked ? "Değiştirmek için yeni key" : "API key"}
            />
          </div>
          <div className="space-y-2">
            <Label>API Secret</Label>
            <Input
              type="password"
              value={apiSecret}
              onChange={(event) => setApiSecret(event.target.value)}
              placeholder="API secret"
            />
          </div>

          {restaurants.length > 0 ? (
            <div className="space-y-2">
              <Label>Restoran</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={restaurantId || connection?.restaurantId || ""}
                onChange={(event) => setRestaurantId(event.target.value)}
              >
                <option value="">Seçin</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name || restaurant.id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
