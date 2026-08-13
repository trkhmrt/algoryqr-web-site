"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMenuProductRequest, flattenMenuCategories } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { useMenuCategoriesByQr } from "@/hooks/use-menu-categories";
import {
  invalidateMenuProducts,
  useMenuProductsPage,
} from "@/hooks/use-menu-products";

type MenuProductsPanelProps = {
  menuId: number;
  qrId: number;
  presetCategoryId?: number | null;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function MenuProductsPanel({
  menuId,
  qrId,
  presetCategoryId,
}: MenuProductsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const [page, setPage] = useState(0);
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">(
    presetCategoryId ?? "all",
  );
  const [filterName, setFilterName] = useState("");
  const [debouncedFilterName, setDebouncedFilterName] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFilterName(filterName.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filterName]);

  useEffect(() => {
    setPage(0);
  }, [qrId, debouncedFilterName, filterCategoryId]);

  const categoriesQuery = useMenuCategoriesByQr(qrId);
  const categories = categoriesQuery.data?.categories ?? [];
  const resolvedMenuId =
    menuId > 0 ? menuId : categoriesQuery.data?.menuId != null && categoriesQuery.data.menuId > 0
      ? categoriesQuery.data.menuId
      : 0;

  const productsQuery = useMenuProductsPage(
    resolvedMenuId,
    {
      page,
      size: PAGE_SIZE,
      q: debouncedFilterName || undefined,
      subCategoryId: filterCategoryId === "all" ? undefined : filterCategoryId,
    },
    resolvedMenuId > 0,
  );
  const products = productsQuery.data?.content ?? [];
  const totalElements = productsQuery.data?.totalElements ?? products.length;
  const totalPages = Math.max(1, productsQuery.data?.totalPages ?? 1);
  const hasNext =
    productsQuery.data?.hasNext ?? page + 1 < totalPages;
  const hasPrev = page > 0;
  const loading =
    categoriesQuery.isLoading ||
    (resolvedMenuId > 0 && productsQuery.isLoading);

  const categoryOptions = flattenMenuCategories(categories);
  const filterCategorySelectOptions = [
    { value: "all", label: "Tümü" },
    ...categoryOptions.map((option) => ({
      value: String(option.id),
      label: option.label,
    })),
  ];

  useEffect(() => {
    if (productsQuery.isError) {
      notify(
        "danger",
        productsQuery.error instanceof Error
          ? productsQuery.error.message
          : "Menü ürünleri yüklenemedi.",
      );
    }
  }, [notify, productsQuery.error, productsQuery.isError]);

  const refreshProducts = () => invalidateMenuProducts(queryClient, resolvedMenuId, qrId);

  const handleDelete = async (productId: number) => {
    try {
      await deleteMenuProductRequest(productId);
      notify("info", "Ürün silindi.");
      await refreshProducts();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Ürün silinemedi.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="flex min-w-[180px] max-w-xs flex-1 items-center gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground">Ürün ara</Label>
            <Input
              className="h-9"
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
              placeholder="Ürün adına göre ara..."
            />
          </div>
          <div className="flex min-w-[220px] max-w-sm flex-1 items-center gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground">Kategori filtresi</Label>
            <SearchableSelect
              className="h-9"
              value={filterCategoryId === "all" ? "all" : String(filterCategoryId)}
              onValueChange={(next) => {
                setFilterCategoryId(next === "all" ? "all" : Number(next));
              }}
              options={filterCategorySelectOptions}
              placeholder="Kategori seçin"
              searchPlaceholder="Kategori ara..."
            />
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() =>
            router.push(
              DASHBOARD_ROUTES.digitalMenuProductCreateFor(
                qrId,
                filterCategoryId === "all" ? null : filterCategoryId,
              ),
            )
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Ürün Ekle
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu filtrede ürün yok.</p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.productId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    [product.mainCategoryName, product.subCategoryName]
                      .filter(Boolean)
                      .join(" / ") || product.subCategorySlug,
                    product.servesPeopleMin != null && product.servesPeopleMax != null
                      ? product.servesPeopleMin === product.servesPeopleMax
                        ? `${product.servesPeopleMin} kişilik`
                        : `${product.servesPeopleMin}–${product.servesPeopleMax} kişilik`
                      : null,
                    product.price ? `${product.price} ${product.currency}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={DASHBOARD_ROUTES.digitalMenuProductDetail(product.productId, qrId)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => void handleDelete(product.productId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalElements > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Toplam {totalElements} ürün · Sayfa {page + 1} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={!hasPrev || productsQuery.isFetching}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Önceki
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={!hasNext || productsQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Sonraki
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
