"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  activateCampaign,
  createCampaign,
  listCampaigns,
  pauseCampaign,
  type CampaignItem,
} from "@/lib/campaign-api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

function statusLabel(status: CampaignItem["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "PAUSED":
      return "Duraklatıldı";
    case "EXPIRED":
      return "Süresi doldu";
    default:
      return "Taslak";
  }
}

export default function CampaignsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseDigitalMenu && !accessLoading,
  );
  const menuId = selection?.menu.menuId ?? null;

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", menuId],
    enabled: menuId != null,
    queryFn: () => listCampaigns(menuId!),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      campaignId,
      action,
    }: {
      campaignId: number;
      action: "activate" | "pause";
    }) => {
      if (menuId == null) throw new Error("Menü seçilmedi");
      return action === "activate"
        ? activateCampaign(menuId, campaignId)
        : pauseCampaign(menuId, campaignId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns", menuId] });
      notify("info", "Kampanya güncellendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof Error ? err.message : "İşlem başarısız.");
    },
  });

  const campaigns = campaignsQuery.data ?? [];

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={DASHBOARD_ROUTES.digitalMenu}>Dijital Menüye Dön</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Kampanyaları yönetmek için dijital menü erişimi gerekir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kampanyalar</h1>
          <p className="text-sm text-muted-foreground">
            Sadakat programı kampanyalarını oluşturun ve müşterilerinize sunun.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <DigitalMenuPicker
            menuQrs={menuQrs}
            selectedQrId={selection?.qr.id ?? null}
            onSelectQrId={(qrId) => {
              void selectQrId(qrId);
            }}
          />
          <Button
            disabled={menuId == null}
            className="gap-1.5"
            onClick={() =>
              router.push(
                selection?.qr.id
                  ? `${DASHBOARD_ROUTES.campaignsCreate}?qr=${selection.qr.id}`
                  : DASHBOARD_ROUTES.campaignsCreate,
              )
            }
          >
            <Plus className="h-4 w-4" />
            Kampanya Oluştur
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {menuQrs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Kampanya oluşturmak için önce bir dijital menü QR kodu oluşturun.
        </div>
      ) : menuId == null ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menü bilgisi yükleniyor…
        </div>
      ) : campaignsQuery.isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Kampanyalar yükleniyor…
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <p className="text-sm font-medium text-foreground">Henüz kampanya yok</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              İlk kampanyanızı oluşturarak müşterilerinize puan, indirim veya ödül tanımlayabilirsiniz.
            </p>
            <Button
              className="gap-1.5"
              onClick={() =>
                router.push(
                  selection?.qr.id
                    ? `${DASHBOARD_ROUTES.campaignsCreate}?qr=${selection.qr.id}`
                    : DASHBOARD_ROUTES.campaignsCreate,
                )
              }
            >
              <Plus className="h-4 w-4" />
              Kampanya Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={
                    selection?.qr.id
                      ? DASHBOARD_ROUTES.campaignDetailForQr(campaign.id, selection.qr.id)
                      : DASHBOARD_ROUTES.campaignDetail(campaign.id)
                  }
                  className="min-w-0 flex-1 space-y-1"
                >
                  <p className="font-medium text-foreground">{campaign.name}</p>
                  {campaign.slogan ? (
                    <p className="text-sm text-muted-foreground">{campaign.slogan}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {campaign.templateCode} · {statusLabel(campaign.status)}
                  </p>
                </Link>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={
                        selection?.qr.id
                          ? DASHBOARD_ROUTES.campaignDetailForQr(campaign.id, selection.qr.id)
                          : DASHBOARD_ROUTES.campaignDetail(campaign.id)
                      }
                    >
                      Detay
                    </Link>
                  </Button>
                  {campaign.status !== "ACTIVE" ? (
                    <Button
                      size="sm"
                      disabled={actionMutation.isPending}
                      onClick={() =>
                        actionMutation.mutate({ campaignId: campaign.id, action: "activate" })
                      }
                    >
                      Yayınla
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionMutation.isPending}
                      onClick={() =>
                        actionMutation.mutate({ campaignId: campaign.id, action: "pause" })
                      }
                    >
                      Duraklat
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
