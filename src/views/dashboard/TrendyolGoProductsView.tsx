"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { useBranches } from "@/hooks/use-branches";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { listTrendyolGoProducts } from "@/lib/trendyol-go-api";
import {
  formatTrendyolGoAmount,
  productAvailabilityClass,
  productAvailabilityLabel,
  TGO_SOFT_CARD_CLASS,
} from "@/lib/trendyol-go-ui";

export default function TrendyolGoProductsView() {
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchesQuery = useBranches(canUseDigitalMenu && !accessLoading);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(null);
  const selectedBranchId = branchId ?? branches[0]?.id ?? null;
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const productsQuery = useQuery({
    queryKey: ["tgo-products", selectedBranchId, q, page],
    queryFn: () => listTrendyolGoProducts(selectedBranchId as number, q, page),
    enabled: selectedBranchId != null && canUseDigitalMenu,
  });

  const pageData = productsQuery.data;
  const products = pageData?.content ?? [];
  const availableCount = products.filter((product) => product.available).length;
  const totalPages = pageData?.totalPages ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={DASHBOARD_ROUTES.integrations}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Entegrasyonlar
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <IntegrationsSectionHeader
          pageTitle="Ürünler"
          pageDescription="Partner menüsündeki mevcut ürünler"
        />
        <div className="flex shrink-0 lg:pt-8">
          <Button asChild variant="outline">
            <Link href={DASHBOARD_ROUTES.uberEats}>Bağlantı</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bu sayfada</p>
          <p className="mt-1 text-xl font-semibold">{products.length}</p>
        </div>
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Satışta</p>
          <p className="mt-1 text-xl font-semibold">{availableCount}</p>
        </div>
        <div className={`${TGO_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Toplam kayıt</p>
          <p className="mt-1 text-xl font-semibold">{pageData?.totalElements ?? 0}</p>
        </div>
      </div>

      <div className={`${TGO_SOFT_CARD_CLASS} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[180px] flex-1 space-y-1.5">
            <label className="text-xs text-muted-foreground">Şube</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedBranchId ?? ""}
              onChange={(event) => {
                setBranchId(Number(event.target.value));
                setPage(0);
              }}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[220px] flex-[2] space-y-1.5">
            <label className="text-xs text-muted-foreground">Ara</label>
            <Input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(0);
              }}
              placeholder="Ürün adı veya kategori"
            />
          </div>
        </div>

        {productsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ürünler yükleniyor…
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-destructive">
            Ürünler alınamadı. Önce restoran bağlayın.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Bu filtrelerle ürün bulunamadı.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {products.map((product) => (
              <article key={product.id} className={`${TGO_SOFT_CARD_CLASS} p-4`}>
                <div className="flex gap-3">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs text-muted-foreground">
                      Görsel yok
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{product.name || "İsimsiz ürün"}</p>
                      <p className="shrink-0 text-sm font-semibold text-foreground">
                        {formatTrendyolGoAmount(product.price, product.currency ?? "TRY")}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {product.categoryName || "Kategori yok"}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${productAvailabilityClass(product.available)}`}
                      >
                        {productAvailabilityLabel(product.available)}
                      </span>
                    </div>
                    {product.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Sayfa {page + 1} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                Önceki
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
