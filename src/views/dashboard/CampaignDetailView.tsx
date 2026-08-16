"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCampaign,
  listCampaignWinners,
  type CampaignItem,
  type CampaignWinner,
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

function templateLabel(code: string): string {
  switch (code) {
    case "STAMP_CARD":
      return "Damga Kartı";
    case "SPEND_THRESHOLD":
      return "Harcama Eşiği";
    default:
      return code;
  }
}

function rewardStatusLabel(status: CampaignWinner["status"]): string {
  switch (status) {
    case "AVAILABLE":
      return "Kullanılabilir";
    case "REDEEMED":
      return "Kullanıldı";
    case "EXPIRED":
      return "Süresi doldu";
    default:
      return status;
  }
}

function winnerName(winner: CampaignWinner): string {
  const name = [winner.firstName, winner.lastName].filter(Boolean).join(" ").trim();
  return name || winner.email || `#${winner.customerId}`;
}

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function WinnersTable({ winners }: { winners: CampaignWinner[] }) {
  if (winners.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Henüz kazanan müşteri yok.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Müşteri</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Kazanma</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {winners.map((winner) => (
          <TableRow key={winner.rewardId}>
            <TableCell className="font-medium">{winnerName(winner)}</TableCell>
            <TableCell>{winner.email || "—"}</TableCell>
            <TableCell>{rewardStatusLabel(winner.status)}</TableCell>
            <TableCell>{formatWhen(winner.issuedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CampaignWinnersDialog({
  open,
  onOpenChange,
  menuId,
  campaignId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: number;
  campaignId: number;
}) {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setDebouncedSearch("");
      setPage(0);
    }
  }, [open]);

  const winnersQuery = useQuery({
    queryKey: ["campaign-winners-all", menuId, campaignId, page, debouncedSearch],
    enabled: open,
    queryFn: () =>
      listCampaignWinners(menuId, campaignId, {
        q: debouncedSearch || undefined,
        page,
        size: 10,
      }),
  });

  const winners = winnersQuery.data?.content ?? [];
  const totalPages = winnersQuery.data?.totalPages ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kazanan Müşteriler</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ad, soyad veya e-posta ara..."
            className="pl-9"
          />
        </div>

        {winnersQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kazananlar yükleniyor…
          </div>
        ) : winnersQuery.isError ? (
          <p className="py-6 text-center text-sm text-destructive">Kazananlar yüklenemedi.</p>
        ) : (
          <>
            <WinnersTable winners={winners} />
            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Sayfa {page + 1} / {totalPages} · Toplam {winnersQuery.data?.totalElements ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 0 || winnersQuery.isFetching}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Önceki
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages || winnersQuery.isFetching}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Sonraki
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CampaignDetailView() {
  const router = useRouter();
  const params = useParams<{ campaignId: string }>();
  const searchParams = useSearchParams();
  const campaignId = Number(params.campaignId);
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const [winnersDialogOpen, setWinnersDialogOpen] = useState(false);

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseDigitalMenu && !accessLoading,
  );
  const menuId = selection?.menu.menuId ?? null;

  const campaignQuery = useQuery({
    queryKey: ["campaign", menuId, campaignId],
    enabled: menuId != null && Number.isFinite(campaignId) && campaignId > 0,
    queryFn: () => getCampaign(menuId!, campaignId),
  });

  const winnersPreviewQuery = useQuery({
    queryKey: ["campaign-winners-preview", menuId, campaignId],
    enabled: menuId != null && Number.isFinite(campaignId) && campaignId > 0,
    queryFn: () => listCampaignWinners(menuId!, campaignId, { page: 0, size: 5 }),
  });

  const campaign = campaignQuery.data;
  const previewWinners = winnersPreviewQuery.data?.content ?? [];
  const totalWinners = winnersPreviewQuery.data?.totalElements ?? 0;

  const backHref = useMemo(
    () =>
      selection?.qr.id
        ? DASHBOARD_ROUTES.campaignsForQr(selection.qr.id)
        : DASHBOARD_ROUTES.campaigns,
    [selection?.qr.id],
  );

  if (!Number.isFinite(campaignId) || campaignId <= 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5" asChild>
          <Link href={DASHBOARD_ROUTES.campaigns}>
            <ArrowLeft className="h-4 w-4" />
            Kampanyalara dön
          </Link>
        </Button>
        <p className="text-sm text-destructive">Geçersiz kampanya.</p>
      </div>
    );
  }

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
          Kampanya detayını görmek için dijital menü erişimi gerekir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5" asChild>
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          Kampanyalara dön
        </Link>
      </Button>

      <DigitalMenuPicker
        menuQrs={menuQrs}
        selectedQrId={selection?.qr.id ?? null}
        onSelectQrId={(qrId) => {
          void selectQrId(qrId);
          router.replace(DASHBOARD_ROUTES.campaignDetailForQr(campaignId, qrId));
        }}
      />

      {menuId == null ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menü bilgisi yükleniyor…
        </div>
      ) : campaignQuery.isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Kampanya yükleniyor…
        </div>
      ) : campaignQuery.isError || !campaign ? (
        <p className="text-sm text-destructive">Kampanya bulunamadı.</p>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
            {campaign.slogan ? (
              <p className="text-sm text-muted-foreground">{campaign.slogan}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {templateLabel(campaign.templateCode)} · {statusLabel(campaign.status)}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kampanya bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Başlangıç</p>
                <p>{formatWhen(campaign.startsAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bitiş</p>
                <p>{formatWhen(campaign.endsAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Toplam kazanan</p>
                <p>{totalWinners}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Kazanan müşteriler</CardTitle>
              {totalWinners > 5 ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setWinnersDialogOpen(true)}>
                  Tümünü gör
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {winnersPreviewQuery.isLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kazananlar yükleniyor…
                </div>
              ) : (
                <>
                  <WinnersTable winners={previewWinners} />
                  {totalWinners > 0 && totalWinners <= 5 ? null : totalWinners > 5 ? (
                    <div className="mt-4 flex justify-end">
                      <Button type="button" variant="link" className="px-0" onClick={() => setWinnersDialogOpen(true)}>
                        Tümünü gör ({totalWinners})
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {menuId != null ? (
        <CampaignWinnersDialog
          open={winnersDialogOpen}
          onOpenChange={setWinnersDialogOpen}
          menuId={menuId}
          campaignId={campaignId}
        />
      ) : null}
    </div>
  );
}
