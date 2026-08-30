"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

import {
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import ProductNutritionPanel from "@/components/dashboard/menu/ProductNutritionPanel";
import { ProductImageField } from "@/components/dashboard/menu/ProductImageField";
import {
  ProductPairingFields,
  normalizePairings,
  type ProductPairingsForm,
} from "@/components/dashboard/menu/ProductPairingFields";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { SmartFeaturePanel } from "@/components/dashboard/SmartFeaturePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MenuProductApiItem,
  MenuProductRequestBody,
  NutritionFacts,
  updateMenuProductRequest,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { PRODUCT_HINTS } from "@/lib/product-hints";
import { createSmartSummaryRequest } from "@/lib/smart-summary";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useDashboardPageLabel } from "@/contexts/dashboard-page-label";
import { useMenuCategoriesByQr, useMenuAllergens, useMenuTags } from "@/hooks/use-menu-categories";
import { invalidateMenuProducts, useMenuProducts } from "@/hooks/use-menu-products";
import { useSmartSummaryAccess } from "@/hooks/use-smart-summary-access";

type DigitalMenuProductDetailViewProps = {
  productId: number;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  currency: string;
  subCategoryId: number;
  descriptorCategoryId: number | null;
  tagIds: number[];
  allergenIds: number[];
  imageUrl: string;
  available: boolean;
  servesPeopleMin: string;
  servesPeopleMax: string;
  chefRecommended: boolean;
  pairings: ProductPairingsForm;
};

function formFromProduct(product: MenuProductApiItem): ProductFormState {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    price: product.price != null ? String(product.price) : "",
    currency: product.currency || "TRY",
    subCategoryId: product.subCategoryId ?? 0,
    descriptorCategoryId: product.descriptorCategoryId ?? null,
    tagIds: (product.tags ?? []).map((tag) => tag.id),
    allergenIds: (product.allergens ?? []).map((allergen) => allergen.id),
    imageUrl: product.imageUrl ?? "",
    available: product.available,
    servesPeopleMin: product.servesPeopleMin != null ? String(product.servesPeopleMin) : "",
    servesPeopleMax: product.servesPeopleMax != null ? String(product.servesPeopleMax) : "",
    chefRecommended: Boolean(product.chefRecommended),
    pairings: normalizePairings(product.pairings),
  };
}

export default function DigitalMenuProductDetailView({ productId }: DigitalMenuProductDetailViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const {
    accessLoading: smartSummaryAccessLoading,
    canUseSmartSummary,
    smartSummaryPackageNames,
  } = useSmartSummaryAccess();
  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { selection, loading: selectionLoading, error: selectionError } =
    useDigitalMenuSelection(initialQrId);
  const menuId = selection?.menu.menuId ?? null;
  const qrId = selection?.qr.id ?? initialQrId;
  const productsQuery = useMenuProducts(menuId);
  const categoriesQuery = useMenuCategoriesByQr(qrId);
  const tagsQuery = useMenuTags();
  const allergensQuery = useMenuAllergens();
  const categories = categoriesQuery.data?.categories ?? [];
  const tags = tagsQuery.data ?? [];
  const allergens = allergensQuery.data ?? [];
  const [productOverride, setProductOverride] = useState<MenuProductApiItem | null>(null);
  const [form, setForm] = useState<ProductFormState | null>(null);
  const [mainCategoryId, setMainCategoryId] = useState<number | "">("");
  const [togglingAvailable, setTogglingAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const productFromQuery = useMemo(() => {
    const products = productsQuery.data ?? [];
    return products.find((item) => item.productId === productId) ?? null;
  }, [productId, productsQuery.data]);

  const product = productOverride?.productId === productId ? productOverride : productFromQuery;
  useDashboardPageLabel(product?.name);

  useEffect(() => {
    setProductOverride(null);
  }, [productId, productsQuery.dataUpdatedAt]);

  useEffect(() => {
    if (!product) {
      setForm(null);
      setMainCategoryId("");
      return;
    }
    setForm(formFromProduct(product));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (product.mainCategoryId != null) {
      setMainCategoryId(product.mainCategoryId);
      return;
    }
    const matched = categories.find((main) =>
      (main.subs ?? []).some((sub) => sub.id === product.subCategoryId),
    );
    if (matched) setMainCategoryId(matched.id);
  }, [product, categories]);

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

  const publicUrl = selection?.menu.publicUrl ?? null;
  const selectedMain = categories.find((main) => main.id === mainCategoryId);
  const subOptions = selectedMain?.subs ?? [];
  const mainCategorySelectOptions = categories.map((main) => ({
    value: String(main.id),
    label: main.name,
  }));
  const subCategorySelectOptions = subOptions.map((sub) => ({
    value: String(sub.id),
    label: sub.name,
  }));
  const selectedSub = subOptions.find((sub) => sub.id === form?.subCategoryId);
  const descriptorSelectOptions = (selectedSub?.descriptors ?? []).map((descriptor) => ({
    value: String(descriptor.id),
    label: descriptor.name,
  }));

  const buildPayload = (next: ProductFormState): MenuProductRequestBody | null => {
    if (!next.name.trim()) {
      notify("warning", "Ürün adı zorunludur.");
      return null;
    }
    if (!next.subCategoryId) {
      notify("warning", "Alt kategori seçin.");
      return null;
    }
    const minValue = next.servesPeopleMin.trim() === "" ? null : Number(next.servesPeopleMin);
    const maxValue = next.servesPeopleMax.trim() === "" ? null : Number(next.servesPeopleMax);
    if (
      (minValue != null && (!Number.isFinite(minValue) || minValue < 1)) ||
      (maxValue != null && (!Number.isFinite(maxValue) || maxValue < 1))
    ) {
      notify("warning", "Kişi sayısı en az 1 olmalı.");
      return null;
    }
    if (minValue != null && maxValue != null && minValue > maxValue) {
      notify("warning", "Min kişi, max kişiden büyük olamaz.");
      return null;
    }
    return {
      name: next.name.trim(),
      description: next.description,
      price: next.price,
      currency: next.currency,
      subCategoryId: next.subCategoryId,
      descriptorCategoryId: next.descriptorCategoryId,
      tagIds: next.tagIds,
      allergenIds: next.allergenIds,
      imageUrl: next.imageUrl,
      available: next.available,
      servesPeopleMin: minValue,
      servesPeopleMax: maxValue,
      nutrition: product?.nutrition ?? undefined,
      chefRecommended: next.chefRecommended,
      pairings: normalizePairings(next.pairings),
    };
  };

  const handleNutritionSaved = async (nutrition: NutritionFacts) => {
    setProductOverride((prev) => {
      const base = prev?.productId === productId ? prev : productFromQuery;
      return base ? { ...base, nutrition } : prev;
    });
    if (menuId != null) {
      await invalidateMenuProducts(queryClient, menuId);
    }
  };

  const handleToggleAvailable = async (nextAvailable: boolean) => {
    if (!product || !form) return;
    const payload = buildPayload({ ...form, available: nextAvailable });
    if (!payload) return;
    setTogglingAvailable(true);
    try {
      const updated = await updateMenuProductRequest(product.productId, payload);
      setProductOverride(updated);
      setForm(formFromProduct(updated));
      notify("info", nextAvailable ? "Ürün aktif edildi." : "Ürün pasif edildi.");
      if (menuId != null) {
        await invalidateMenuProducts(queryClient, menuId, qrId ?? undefined);
      }
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Durum güncellenemedi.");
    } finally {
      setTogglingAvailable(false);
    }
  };

  const handleSave = async () => {
    if (!product || !form) return;
    const payload = buildPayload(form);
    if (!payload) return;
    setSaving(true);
    try {
      const updated = await updateMenuProductRequest(product.productId, payload);
      setProductOverride(updated);
      setForm(formFromProduct(updated));
      notify("info", "Ürün güncellendi.");
      if (menuId != null) {
        await invalidateMenuProducts(queryClient, menuId, qrId ?? undefined);
      }
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Ürün güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleSmartSummary = async () => {
    if (!form) return;
    if (!canUseSmartSummary) {
      notify("warning", "Akıllı Özet için paketinizde bu özellik bulunmuyor.");
      router.push(DASHBOARD_ROUTES.accountPackagesHighlight("SMART_SUMMARY"));
      return;
    }
    if (!form.name.trim()) {
      notify("warning", "Akıllı özet için önce ürün adı girin.");
      return;
    }
    const selectedTags = tags.filter((tag) => form.tagIds.includes(tag.id));
    const selectedAllergens = allergens.filter((item) => form.allergenIds.includes(item.id));
    const selectedSub = subOptions.find((sub) => sub.id === form.subCategoryId);
    setSummaryLoading(true);
    try {
      const result = await createSmartSummaryRequest({
        product: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: form.price.trim() || undefined,
          currency: form.currency || "TRY",
          mainCategoryName: selectedMain?.name,
          subCategoryName: selectedSub?.name,
          tags: selectedTags.map((tag) => tag.name),
          allergens: selectedAllergens.map((item) => item.name),
          servesPeopleMin:
            form.servesPeopleMin.trim() === "" ? null : Number(form.servesPeopleMin),
          servesPeopleMax:
            form.servesPeopleMax.trim() === "" ? null : Number(form.servesPeopleMax),
          chefRecommended: form.chefRecommended,
          available: form.available,
          nutrition: product?.nutrition ?? undefined,
        },
        locale: "tr",
      });
      setForm({ ...form, description: result.description });
      notify("info", "Akıllı özet açıklamaya yazıldı.");
    } catch (error) {
      notify(
        "danger",
        error instanceof Error ? error.message : "Akıllı özet üretilemedi.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadingProduct = Boolean(menuId) && productsQuery.isLoading;
  const busy = saving || togglingAvailable || summaryLoading;

  return (
    <div className="space-y-3 animate-fade-in">
        <div className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Ürünler
            </Link>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:text-base">
              {form?.name || product?.name || "Ürün detayı"}
            </h1>
            {form ? (
              <div className="flex items-center gap-2">
                <Label htmlFor="product-available" className="text-xs text-muted-foreground">
                  {form.available ? "Aktif" : "Pasif"}
                </Label>
                <Switch
                  id="product-available"
                  checked={form.available}
                  disabled={busy}
                  onCheckedChange={(checked) => void handleToggleAvailable(checked)}
                />
              </div>
            ) : null}
            {publicUrl ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Sitede görüntüle"
                      onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sitede görüntüle</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            <Button size="sm" className="h-8" disabled={!form || busy} onClick={() => void handleSave()}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>

        {selectionLoading || loadingProduct ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ürün yükleniyor…
          </div>
        ) : selectionError ? (
          <p className="text-sm text-destructive">{selectionError}</p>
        ) : !product || !form ? (
          <p className="text-sm text-muted-foreground">Ürün bulunamadı.</p>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <div className="grid grid-cols-2 gap-2 p-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Ürün adı</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ana kategori</Label>
                <SearchableSelect
                  value={mainCategoryId === "" ? "" : String(mainCategoryId)}
                  onValueChange={(next) => {
                    setMainCategoryId(next ? Number(next) : "");
                    setForm({ ...form, subCategoryId: 0, descriptorCategoryId: null });
                  }}
                  options={mainCategorySelectOptions}
                  placeholder="Ana kategori seçin"
                  searchPlaceholder="Kategori ara..."
                  emptyText="Kategori bulunamadı."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Alt kategori</Label>
                <SearchableSelect
                  value={form.subCategoryId ? String(form.subCategoryId) : ""}
                  onValueChange={(next) =>
                    setForm({
                      ...form,
                      subCategoryId: next ? Number(next) : 0,
                      descriptorCategoryId: null,
                    })
                  }
                  options={subCategorySelectOptions}
                  placeholder="Alt kategori seçin"
                  searchPlaceholder="Alt kategori ara..."
                  emptyText="Alt kategori bulunamadı."
                  disabled={mainCategoryId === ""}
                />
              </div>
              {descriptorSelectOptions.length > 0 ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanımlayıcı kategori</Label>
                  <SearchableSelect
                    value={form.descriptorCategoryId ? String(form.descriptorCategoryId) : ""}
                    onValueChange={(next) =>
                      setForm({
                        ...form,
                        descriptorCategoryId: next ? Number(next) : null,
                      })
                    }
                    options={descriptorSelectOptions}
                    placeholder="Tanımlayıcı seçin (isteğe bağlı)"
                    searchPlaceholder="Tanımlayıcı ara..."
                    emptyText="Tanımlayıcı bulunamadı."
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-xs">Fiyat</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min kişi</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.servesPeopleMin}
                    onChange={(e) => setForm({ ...form, servesPeopleMin: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max kişi</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.servesPeopleMax}
                    onChange={(e) => setForm({ ...form, servesPeopleMax: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <ProductPairingFields
                  pairings={normalizePairings(form.pairings)}
                  onChange={(pairings) => setForm({ ...form, pairings })}
                  products={productsQuery.data ?? []}
                  categories={categories}
                  excludeProductId={product.productId}
                  disabled={busy}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Etiketler</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-border p-2">
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Etiket yok.</p>
                  ) : (
                    tags.map((tag) => {
                      const selected = form.tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`rounded-md px-2 py-0.5 text-xs ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => {
                            const current = new Set(form.tagIds);
                            if (current.has(tag.id)) current.delete(tag.id);
                            else current.add(tag.id);
                            setForm({ ...form, tagIds: Array.from(current) });
                          }}
                        >
                          {tag.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Alerjen maddeler</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-border p-2">
                  {allergens.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Alerjen yok.</p>
                  ) : (
                    allergens.map((allergen) => {
                      const selected = form.allergenIds.includes(allergen.id);
                      return (
                        <button
                          key={allergen.id}
                          type="button"
                          className={`rounded-md px-2 py-0.5 text-xs ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => {
                            const current = new Set(form.allergenIds);
                            if (current.has(allergen.id)) current.delete(allergen.id);
                            else current.add(allergen.id);
                            setForm({ ...form, allergenIds: Array.from(current) });
                          }}
                        >
                          {allergen.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-3">
                <SmartFeaturePanel
                  title="Akıllı Özet"
                  hint={PRODUCT_HINTS.SMART_SUMMARY}
                  description={
                    canUseSmartSummary
                      ? "Yapay zeka destekli ürün açıklaması oluşturun."
                      : `Aktif paketinizde Akıllı Özet yok. ${
                          smartSummaryPackageNames.length > 0
                            ? smartSummaryPackageNames.join(" veya ")
                            : "uygun paketler"
                        } ile yapay zeka destekli açıklamalar oluşturun.`
                  }
                  actionLabel={canUseSmartSummary ? "Akıllı Özet" : "Paketi incele"}
                  loading={summaryLoading}
                  loadingSkeleton={smartSummaryAccessLoading}
                  disabled={busy && !summaryLoading}
                  onActionClick={() => void handleSmartSummary()}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Açıklama</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <ProductImageField
                  menuId={menuId ?? 0}
                  value={form.imageUrl}
                  onChange={(imageUrl) => setForm({ ...form, imageUrl: imageUrl ?? "" })}
                  disabled={busy || menuId == null}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm text-foreground">Şef önerisi</p>
                  <p className="text-xs text-muted-foreground">Public menüde öne çıkar.</p>
                </div>
                <Switch
                  checked={form.chefRecommended}
                  onCheckedChange={(checked) => setForm({ ...form, chefRecommended: checked })}
                />
              </div>
            </div>

            <div className="border-t border-border p-3">
              <ProductNutritionPanel
                productId={product.productId}
                nutrition={product.nutrition}
                onSaved={handleNutritionSaved}
              />
            </div>
          </div>
        )}
    </div>
  );
}
