"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareText, Star } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { useListQueryState } from "@/hooks/use-list-query-state";
import { Button } from "@/components/ui/button";
import {
  getMenuFeedbackRequest,
  getMenuFeedbackSummaryRequest,
  type FeedbackTypeFilter,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_LIST_ITEM, DASHBOARD_STAT_TILE } from "@/lib/dashboard-surface";

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

  const { setQuery } = useListQueryState();
  const [type, setType] = useState<FeedbackTypeFilter>(
    () => (searchParams.get("type") as FeedbackTypeFilter) || "all",
  );
  const [minScore, setMinScore] = useState<number | "">(() => {
    const raw = searchParams.get("minScore");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : "";
  });
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
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="Geri Bildirimler"
          hint="Müşterilerin menü ve ürün puanlarını buradan inceleyin."
        />
        <DashboardLoadingState label="Geri bildirimler hazırlanıyor..." />
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
      <DashboardPageHeader
        title="Geri Bildirimler"
        hint="Müşterilerin menü ve ürün puanlarını buradan inceleyin."
        back={
          <Link
            href={
              selection
                ? DASHBOARD_ROUTES.digitalMenuEdit(selection.qr.id)
                : DASHBOARD_ROUTES.digitalMenu
            }
            aria-label="Geri"
            className={DASHBOARD_BACK}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
        action={
          <DigitalMenuPicker
            menuQrs={menuQrs}
            selectedQrId={selection?.qr.id ?? null}
            onSelectQrId={(qrId) => {
              setPage(0);
              void selectQrId(qrId);
            }}
          />
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {menuId != null ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {summaryCards.map((card) => (
              <div key={card.key} className={DASHBOARD_STAT_TILE}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
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
                </div>
              </div>
            ))}
          </div>

          <DashboardFilterBar>
            <FilterSelect
              className="w-[11rem]"
              label="Tür"
              value={type}
              onValueChange={(next) => {
                const value = next as FeedbackTypeFilter;
                setType(value);
                setPage(0);
                setQuery({ type: value === "all" ? null : value });
              }}
              options={[
                { value: "all", label: "Tümü" },
                { value: "menu", label: "Menü" },
                { value: "product", label: "Ürün" },
              ]}
            />
            <FilterSelect
              className="w-[11rem]"
              label="Min. puan"
              value={minScore === "" ? "all" : String(minScore)}
              onValueChange={(next) => {
                const value = next === "all" ? "" : Number(next);
                setMinScore(value);
                setPage(0);
                setQuery({ minScore: value === "" ? null : String(value) });
              }}
              options={[
                { value: "all", label: "Hepsi" },
                ...[1, 2, 3, 4, 5].map((score) => ({
                  value: String(score),
                  label: `${score}+`,
                })),
              ]}
            />
          </DashboardFilterBar>

          {listQuery.isLoading ? (
            <DashboardLoadingState label="Geri bildirimler yükleniyor…" />
          ) : items.length === 0 ? (
            <EmptyState
              title={type !== "all" || minScore !== "" ? "Filtrelere uyan geri bildirim yok" : "Henüz geri bildirim yok"}
              description={
                type !== "all" || minScore !== ""
                  ? "Tür veya puan filtresini temizleyip tekrar deneyin."
                  : "Müşteriler puan verdiğinde burada görünür."
              }
              action={
                type !== "all" || minScore !== "" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setType("all");
                      setMinScore("");
                      setPage(0);
                      setQuery({ type: null, minScore: null });
                    }}
                  >
                    Filtreleri temizle
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={`${item.type}-${item.id}`} className={`${DASHBOARD_LIST_ITEM} space-y-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground">{item.deviceType}</p>
                    ) : null}
                </article>
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
