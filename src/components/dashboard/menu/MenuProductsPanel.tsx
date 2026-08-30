"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImageIcon, Loader2, Plus, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMenuProductRequest, flattenMenuCategories } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_LIST_ITEM } from "@/lib/dashboard-surface";
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

function ProductListThumbnail({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted/40 sm:h-16 sm:w-16">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-5 w-5 text-muted-foreground/60" aria-hidden />
        </div>
      )}
    </div>
  );
}

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
  const [deleteTarget, setDeleteTarget] = useState<{ productId: number; name: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMenuProductRequest(deleteTarget.productId);
      notify("info", "Ürün silindi.");
      setDeleteTarget(null);
      await refreshProducts();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Ürün silinemedi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="grid w-full gap-3 sm:flex sm:min-w-0 sm:flex-1 sm:flex-wrap sm:items-end sm:gap-2">
          <div className="flex w-full flex-col gap-1.5 sm:min-w-[180px] sm:max-w-xs sm:flex-1 sm:flex-row sm:items-center sm:gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground sm:whitespace-nowrap">
              Ürün ara
            </Label>
            <Input
              className="h-9 w-full"
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
              placeholder="Ürün adına göre ara..."
            />
          </div>
          <div className="flex w-full flex-col gap-1.5 sm:min-w-[220px] sm:max-w-sm sm:flex-1 sm:flex-row sm:items-center sm:gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground sm:whitespace-nowrap">
              Kategori filtresi
            </Label>
            <SearchableSelect
              className="h-9 w-full"
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
          className="w-full shrink-0 gap-1.5 sm:w-auto"
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
          {products.map((product) => {
            const categoryLabel =
              [product.mainCategoryName, product.subCategoryName]
                .filter(Boolean)
                .join(" / ") || product.subCategorySlug;
            const servingLabel =
              product.servesPeopleMin != null && product.servesPeopleMax != null
                ? product.servesPeopleMin === product.servesPeopleMax
                  ? `${product.servesPeopleMin} kişilik`
                  : `${product.servesPeopleMin}–${product.servesPeopleMax} kişilik`
                : null;
            const priceLabel = product.price ? `${product.price} ${product.currency}` : null;

            return (
            <div
              key={product.productId}
              className={`${DASHBOARD_LIST_ITEM} flex items-start gap-3 sm:items-center`}
            >
              <ProductListThumbnail name={product.name} imageUrl={product.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{product.name}</p>
                {categoryLabel ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{categoryLabel}</p>
                ) : null}
                {servingLabel || priceLabel ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {[servingLabel, priceLabel].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
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
                  onClick={() =>
                    setDeleteTarget({ productId: product.productId, name: product.name })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            );
          })}
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

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürün silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{deleteTarget?.name ?? "Bu ürün"}</span> menüden
              kaldırılacak. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
