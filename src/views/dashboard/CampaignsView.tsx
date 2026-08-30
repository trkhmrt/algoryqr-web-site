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
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { useListQueryState } from "@/hooks/use-list-query-state";
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

  const { setQuery } = useListQueryState();
  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignItem["status"]>(
    () => (searchParams.get("status") as CampaignItem["status"]) || "all",
  );
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr");
    return campaigns.filter((campaign) => {
      if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
      if (!query) return true;
      const haystack = `${campaign.name} ${campaign.slogan ?? ""} ${campaign.templateCode}`.toLocaleLowerCase("tr");
      return haystack.includes(query);
    });
  }, [campaigns, search, statusFilter]);

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
        <EmptyState
          title="Menü gerekli"
          description="Kampanya oluşturmak için önce bir dijital menü yayınlayın."
          action={
            <Button asChild variant="outline">
              <Link href={DASHBOARD_ROUTES.digitalMenu}>Menü oluştur</Link>
            </Button>
          }
        />
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
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FilterSelect
              className="w-full sm:w-[12rem]"
              label="Durum"
              value={statusFilter}
              onValueChange={(next) => {
                const value = next as typeof statusFilter;
                setStatusFilter(value);
                setQuery({ status: value === "all" ? null : value });
              }}
              options={[
                { value: "all", label: "Tümü" },
                { value: "ACTIVE", label: "Aktif" },
                { value: "PAUSED", label: "Duraklatıldı" },
                { value: "EXPIRED", label: "Süresi doldu" },
                { value: "DRAFT", label: "Taslak" },
              ]}
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ara</Label>
              <Input
                value={search}
                onChange={(event) => {
                  const next = event.target.value;
                  setSearch(next);
                  setQuery({ q: next.trim() || null });
                }}
                placeholder="Kampanya adı veya slogan"
                aria-label="Kampanya ara"
              />
            </div>
          </div>
      {campaigns.length === 0 ? (
        <EmptyState
          title="Henüz kampanya yok"
          description="İlk kampanyanızı oluşturarak müşterilerinize puan, indirim veya ödül tanımlayın."
          action={
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
          }
        />
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          title="Filtrelere uyan kampanya yok"
          description="Durum veya arama filtresini temizleyip tekrar deneyin."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
                setQuery({ status: null, q: null });
              }}
            >
              Filtreleri temizle
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => (
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
        </>
      )}
    </div>
  );
}
