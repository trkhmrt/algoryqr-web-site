"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { UberEatsItemEditSheet } from "@/components/dashboard/ubereats/UberEatsItemEditSheet";
import { UberEatsProductCard } from "@/components/dashboard/ubereats/UberEatsProductCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import {
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  createUberEatsProduct,
  listUberEatsProducts,
  type CreateUberEatsProductPayload,
} from "@/lib/ubereats-api";
import {
  groupProductsByCategory,
  uniqueCategoryNames,
  UNCATEGORIZED_LABEL,
  UBER_EATS_SOFT_CARD_CLASS,
} from "@/lib/ubereats-ui";

export default function UberEatsProductsView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const selectionState = useDigitalMenuSelection(null, canUseDigitalMenu && !accessLoading);
  const menuId = selectionState.selection?.menu.menuId ?? 0;
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presetCategory, setPresetCategory] = useState("");

  const productsQuery = useQuery({
    queryKey: ["ubereats-products", q, page],
    queryFn: () => listUberEatsProducts(q, page),
    enabled: canUseDigitalMenu && !accessLoading,
  });

  const pageData = productsQuery.data;
  const products = pageData?.content ?? [];
  const availableCount = products.filter((product) => product.available).length;
  const totalPages = pageData?.totalPages ?? 0;
  const categoryOptions = useMemo(() => uniqueCategoryNames(products), [products]);
  const grouped = useMemo(() => groupProductsByCategory(products), [products]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateUberEatsProductPayload) => createUberEatsProduct(payload),
    onSuccess: async () => {
      setSheetOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["ubereats-products"] });
      notify("info", "Ürün Uber Eats menüsüne eklendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Ürün eklenemedi.");
    },
  });

  const openCreate = (categoryName = "") => {
    setPresetCategory(categoryName === UNCATEGORIZED_LABEL ? "" : categoryName);
    setSheetOpen(true);
  };

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
        <div className="flex shrink-0 gap-2 lg:pt-8">
          <Button asChild variant="outline">
            <Link href={DASHBOARD_ROUTES.uberEats}>Bağlantı</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bu sayfada</p>
          <p className="mt-1 text-xl font-semibold">{products.length}</p>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Satışta</p>
          <p className="mt-1 text-xl font-semibold">{availableCount}</p>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Toplam kayıt</p>
          <p className="mt-1 text-xl font-semibold">{pageData?.totalElements ?? 0}</p>
        </div>
      </div>

      <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[220px] flex-1 space-y-1.5">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5" disabled={productsQuery.isError}>
                <Plus className="h-3.5 w-3.5" />
                Ekle
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openCreate()}>Ürün ekle</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Bu filtrelerle ürün bulunamadı.
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openCreate()}>
              <Plus className="h-3.5 w-3.5" />
              Ürün ekle
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {grouped.map((group) => (
              <section key={group.categoryName} className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">{group.categoryName}</h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {group.products.map((product) => (
                    <UberEatsProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  onClick={() => openCreate(group.categoryName)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ürün ekle
                </Button>
              </section>
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

      <UberEatsItemEditSheet
        open={sheetOpen}
        categoryName={presetCategory}
        categoryOptions={categoryOptions}
        menuId={menuId}
        saving={createMutation.isPending}
        onOpenChange={setSheetOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        onInvalid={(error) => notify("danger", error)}
      />
    </div>
  );
}
