"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  DigitalMenuGate,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import ProductNutritionPanel from "@/components/dashboard/menu/ProductNutritionPanel";
import { getMenuProductsRequest, MenuProductApiItem, NutritionFacts } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardBanners } from "@/contexts/dashboard-banners";

type DigitalMenuProductDetailViewProps = {
  productId: number;
};

export default function DigitalMenuProductDetailView({ productId }: DigitalMenuProductDetailViewProps) {
  const searchParams = useSearchParams();
  const { notify } = useDashboardBanners();
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { selection, loading: selectionLoading, error: selectionError } =
    useDigitalMenuSelection(initialQrId);
  const [product, setProduct] = useState<MenuProductApiItem | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const loadProduct = useCallback(async () => {
    if (!selection?.menu.menuId) {
      setProduct(null);
      setLoadingProduct(false);
      return;
    }
    setLoadingProduct(true);
    try {
      const products = await getMenuProductsRequest(selection.menu.menuId);
      const found = products.find((item) => item.productId === productId) ?? null;
      setProduct(found);
      if (!found) {
        notify("danger", "�r�n bulunamad?.");
      }
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "�r�n y�klenemedi.");
      setProduct(null);
    } finally {
      setLoadingProduct(false);
    }
  }, [notify, productId, selection?.menu.menuId]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const backHref =
    selection?.qr.id != null
      ? `${DASHBOARD_ROUTES.digitalMenuProducts}?qr=${selection.qr.id}`
      : DASHBOARD_ROUTES.digitalMenuProducts;

  const handleNutritionSaved = (nutrition: NutritionFacts) => {
    setProduct((prev) => (prev ? { ...prev, nutrition } : prev));
  };

  return (
    <DigitalMenuGate accessLoading={accessLoading} canUse={canUseDigitalMenu}>
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            �r�nlere d�n
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">�r�n detay?</h1>
            <p className="text-sm text-muted-foreground">
              �r�n bilgilerini g�r�nt�leyin ve besin de?erlerini g�ncelleyin.
            </p>
          </div>
        </div>

        {selectionLoading || loadingProduct ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            �r�n y�kleniyor�
          </div>
        ) : selectionError ? (
          <p className="text-sm text-destructive">{selectionError}</p>
        ) : !product ? (
          <p className="text-sm text-muted-foreground">�r�n bulunamad?.</p>
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
                    product.available ? "Sat??ta" : "Sat?? d???",
                  ]
                    .filter(Boolean)
                    .join(" � ")}
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
