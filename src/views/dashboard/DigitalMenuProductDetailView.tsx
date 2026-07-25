"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  DigitalMenuGate,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import ProductNutritionPanel from "@/components/dashboard/menu/ProductNutritionPanel";
import { MenuProductApiItem, NutritionFacts } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateMenuProducts, useMenuProducts } from "@/hooks/use-menu-products";

type DigitalMenuProductDetailViewProps = {
  productId: number;
};

export default function DigitalMenuProductDetailView({ productId }: DigitalMenuProductDetailViewProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { selection, loading: selectionLoading, error: selectionError } =
    useDigitalMenuSelection(initialQrId);
  const menuId = selection?.menu.menuId ?? null;
  const productsQuery = useMenuProducts(menuId);
  const [productOverride, setProductOverride] = useState<MenuProductApiItem | null>(null);

  const productFromQuery = useMemo(() => {
    const products = productsQuery.data ?? [];
    return products.find((item) => item.productId === productId) ?? null;
  }, [productId, productsQuery.data]);

  const product = productOverride?.productId === productId ? productOverride : productFromQuery;

  useEffect(() => {
    setProductOverride(null);
  }, [productId, productsQuery.dataUpdatedAt]);

  useEffect(() => {
    if (!selection?.menu.menuId || !productsQuery.isFetched || productsQuery.isFetching) return;
    if (productsQuery.isError) {
      notify(
        "danger",
        productsQuery.error instanceof Error ? productsQuery.error.message : "Ürün yüklenemedi.",
      );
      return;
    }
    if (productsQuery.isSuccess && !productFromQuery) {
      notify("danger", "Ürün bulunamadı.");
    }
  }, [productId, productsQuery.dataUpdatedAt, productsQuery.isError, selection?.menu.menuId]);

  const backHref =
    selection?.qr.id != null
      ? `${DASHBOARD_ROUTES.digitalMenuProducts}?qr=${selection.qr.id}`
      : DASHBOARD_ROUTES.digitalMenuProducts;

  const handleNutritionSaved = async (nutrition: NutritionFacts) => {
    setProductOverride((prev) => {
      const base = prev?.productId === productId ? prev : productFromQuery;
      return base ? { ...base, nutrition } : prev;
    });
    if (menuId != null) {
      await invalidateMenuProducts(queryClient, menuId);
    }
  };

  const loadingProduct = Boolean(menuId) && productsQuery.isLoading;

  return (
    <DigitalMenuGate accessLoading={accessLoading} canUse={canUseDigitalMenu}>
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ürünlere dön
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ürün detayı</h1>
            <p className="text-sm text-muted-foreground">
              Ürün bilgilerini görüntüleyin ve besin değerlerini güncelleyin.
            </p>
          </div>
        </div>

        {selectionLoading || loadingProduct ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ürün yükleniyor…
          </div>
        ) : selectionError ? (
          <p className="text-sm text-destructive">{selectionError}</p>
        ) : !product ? (
          <p className="text-sm text-muted-foreground">Ürün bulunamadı.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-3">
              <div>
                <h2 className="text-lg font-medium text-foreground">{product.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[
                    product.categoryPath || product.categoryName || product.category,
                    product.price != null && product.price !== ""
                      ? `${product.price} ${product.currency}`
                      : null,
                    product.available ? "Satışta" : "Satış dışı",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {product.description ? (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{product.description}</p>
              ) : null}
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-48 rounded-md border border-border object-cover"
                />
              ) : null}
            </div>

            <ProductNutritionPanel
              productId={product.productId}
              nutrition={product.nutrition}
              onSaved={handleNutritionSaved}
            />
          </div>
        )}
      </div>
    </DigitalMenuGate>
  );
}
