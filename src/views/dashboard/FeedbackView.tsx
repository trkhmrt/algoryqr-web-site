"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageSquareText, Star } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getMenuFeedbackRequest,
  getMenuFeedbackSummaryRequest,
  type FeedbackTypeFilter,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAvg(value?: number | string | null): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "0.0";
  return n.toFixed(1);
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${score} yıldız`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-3.5 w-3.5 ${
            value <= score
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

export default function FeedbackView() {
  const searchParams = useSearchParams();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseDigitalMenu && !accessLoading,
  );

  const [type, setType] = useState<FeedbackTypeFilter>("all");
  const [minScore, setMinScore] = useState<number | "">("");
  const [page, setPage] = useState(0);

  const menuId = selection?.menu.menuId ?? null;

  const summaryQuery = useQuery({
    queryKey: ["menu-feedback-summary", menuId],
    enabled: menuId != null,
    queryFn: () => getMenuFeedbackSummaryRequest(menuId!),
  });

  const listQuery = useQuery({
    queryKey: ["menu-feedback", menuId, type, minScore, page],
    enabled: menuId != null,
    queryFn: () =>
      getMenuFeedbackRequest(menuId!, {
        type,
        minScore: minScore === "" ? undefined : minScore,
        page,
        size: 20,
      }),
  });

  const items = listQuery.data?.content ?? [];
  const totalPages = listQuery.data?.totalPages ?? 0;

  const summaryCards = useMemo(() => {
    const menu = summaryQuery.data?.menu;
    const products = summaryQuery.data?.products;
    return [
      {
        key: "menu",
        label: "Menü puanı",
        avg: formatAvg(menu?.ratingAvg),
        count: menu?.ratingCount ?? 0,
      },
      {
        key: "products",
        label: "Ürün puanları",
        avg: formatAvg(products?.ratingAvg),
        count: products?.ratingCount ?? 0,
      },
    ];
  }, [summaryQuery.data]);

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
          Geri bildirimleri görmek için dijital menü erişimi gerekir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5" asChild>
            <Link
              href={
                selection
                  ? DASHBOARD_ROUTES.digitalMenuEdit(selection.qr.id)
                  : DASHBOARD_ROUTES.digitalMenu
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Geri Bildirimler
            </h1>
            <p className="text-sm text-muted-foreground">
              Müşterilerin menü ve ürün puanlarını buradan inceleyin.
            </p>
          </div>
        </div>
        <DigitalMenuPicker
          menuQrs={menuQrs}
          selectedQrId={selection?.qr.id ?? null}
          onSelectQrId={(qrId) => {
            setPage(0);
            void selectQrId(qrId);
          }}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {menuId != null ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {summaryCards.map((card) => (
              <Card key={card.key}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {card.key === "menu" ? (
                      <MessageSquareText className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-foreground">
                      {card.avg}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {card.count} oy
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[11rem] space-y-1.5">
              <label className="text-xs text-muted-foreground">Tür</label>
              <SearchableSelect
                value={type}
                onValueChange={(next) => {
                  setType(next as FeedbackTypeFilter);
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "Tümü" },
                  { value: "menu", label: "Menü" },
                  { value: "product", label: "Ürün" },
                ]}
                placeholder="Tür seçin"
                searchPlaceholder="Tür ara..."
              />
            </div>
            <div className="w-[11rem] space-y-1.5">
              <label className="text-xs text-muted-foreground">Min. puan</label>
              <SearchableSelect
                value={minScore === "" ? "all" : String(minScore)}
                onValueChange={(next) => {
                  setMinScore(next === "all" ? "" : Number(next));
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "Hepsi" },
                  ...[1, 2, 3, 4, 5].map((score) => ({
                    value: String(score),
                    label: `${score}+`,
                  })),
                ]}
                placeholder="Puan seçin"
                searchPlaceholder="Puan ara..."
              />
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Geri bildirimler yükleniyor…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Bu filtrelerle henüz geri bildirim yok.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={`${item.type}-${item.id}`}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {item.type === "product" ? "Ürün" : "Menü"}
                        </span>
                        {item.type === "product" && item.productName ? (
                          <span className="text-sm font-medium text-foreground">
                            {item.productName}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <Stars score={item.score} />
                    {item.comment ? (
                      <p className="text-sm leading-relaxed text-foreground">{item.comment}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Yorum yok</p>
                    )}
                    {item.deviceType ? (
                      <p className="text-[11px] text-muted-foreground">{item.deviceType}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Önceki
              </Button>
              <p className="text-xs text-muted-foreground">
                Sayfa {page + 1} / {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={!listQuery.data?.hasNext || listQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
