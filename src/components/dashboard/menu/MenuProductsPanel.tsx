"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from "lucide-react";

import { RainbowBeamButton } from "@/components/dashboard/RainbowBeamButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMenuProductRequest,
  deleteMenuProductRequest,
  flattenMenuCategories,
  MenuProductRequestBody,
  NutritionBasis,
  NutritionFacts,
  updateMenuProductRequest,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  hasActiveProductAccess,
  isDateUsablePurchase,
  matchesProductCode,
} from "@/lib/product-access";
import { createSmartSummaryRequest } from "@/lib/smart-summary";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  buildNutritionFactsFromForm,
  emptyNutritionFacts,
} from "@/components/dashboard/menu/ProductNutritionPanel";
import { ProductImageField } from "@/components/dashboard/menu/ProductImageField";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { useMenuCategoriesByQr, useMenuAllergens, useMenuTags } from "@/hooks/use-menu-categories";
import {
  invalidateMenuProducts,
  useMenuProductsPage,
} from "@/hooks/use-menu-products";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";

type MenuProductsPanelProps = {
  menuId: number;
  qrId: number;
  presetCategoryId?: number | null;
  onPresetConsumed?: () => void;
};

type NutritionFormFields = {
  basis: NutritionBasis;
  energyKj: string;
  energyKcal: string;
  fat: string;
  saturatedFat: string;
  carbohydrate: string;
  sugars: string;
  fibre: string;
  protein: string;
  salt: string;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const emptyNutritionForm = (): NutritionFormFields => ({
  basis: "PER_100G",
  energyKj: "",
  energyKcal: "",
  fat: "",
  saturatedFat: "",
  carbohydrate: "",
  sugars: "",
  fibre: "",
  protein: "",
  salt: "",
});

const emptyForm = (subCategoryId?: number | null): MenuProductRequestBody => ({
  name: "",
  description: "",
  price: "",
  currency: "TRY",
  subCategoryId: subCategoryId ?? 0,
  tagIds: [],
  allergenIds: [],
  imageUrl: "",
  available: true,
  servesPeopleMin: 1,
  servesPeopleMax: 1,
  nutrition: emptyNutritionFacts(),
});

export default function MenuProductsPanel({
  menuId,
  qrId,
  presetCategoryId,
  onPresetConsumed,
}: MenuProductsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const subscription = useSubscription();
  const packages = useActivePackages();
  const [page, setPage] = useState(0);
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");
  const [filterName, setFilterName] = useState("");
  const [debouncedFilterName, setDebouncedFilterName] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

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
  const tagsQuery = useMenuTags();
  const allergensQuery = useMenuAllergens();
  const categories = categoriesQuery.data?.categories ?? [];
  const tags = tagsQuery.data ?? [];
  const allergens = allergensQuery.data ?? [];
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuProductRequestBody>(emptyForm());
  const [mainCategoryId, setMainCategoryId] = useState<number | "">("");
  const [nutritionForm, setNutritionForm] = useState<NutritionFormFields>(emptyNutritionForm());
  const [showForm, setShowForm] = useState(false);

  const entitlements = Array.isArray(subscription.data?.entitlements)
    ? subscription.data.entitlements
    : [];
  const purchases = Array.isArray(subscription.data?.purchases) ? subscription.data.purchases : [];
  const activePurchase = subscription.data?.activePurchase ?? null;
  const activePackage =
    packages.data?.find(
      (pkg) => activePurchase?.packageId != null && pkg.id === activePurchase.packageId,
    ) ??
    packages.data?.find(
      (pkg) =>
        !!activePurchase?.packageCode && pkg.code === activePurchase.packageCode,
    ) ??
    null;
  const activePackageHasSmartSummary =
    !!activePurchase &&
    isDateUsablePurchase(activePurchase) &&
    !!activePackage?.items?.some((item) =>
      matchesProductCode(item.productCode, "SMART_SUMMARY"),
    );
  const canUseSmartSummary =
    hasActiveProductAccess(entitlements, purchases, "SMART_SUMMARY") ||
    activePackageHasSmartSummary;

  const categoryOptions = flattenMenuCategories(categories);
  const selectedMain = categories.find((main) => main.id === mainCategoryId);
  const subOptions = selectedMain?.subs ?? [];
  const selectedSub = subOptions.find((sub) => sub.id === form.subCategoryId);
  const mainCategorySelectOptions = categories.map((main) => ({
    value: String(main.id),
    label: main.name,
  }));
  const subCategorySelectOptions = subOptions.map((sub) => ({
    value: String(sub.id),
    label: sub.name,
  }));
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

  useEffect(() => {
    if (presetCategoryId == null) return;
    const main = categories.find((item) =>
      (item.subs ?? []).some((sub) => sub.id === presetCategoryId),
    );
    setMainCategoryId(main?.id ?? "");
    setForm(emptyForm(presetCategoryId));
    setNutritionForm(emptyNutritionForm());
    setEditingId(null);
    setShowForm(true);
    setFilterCategoryId(presetCategoryId);
    onPresetConsumed?.();
  }, [presetCategoryId, onPresetConsumed, categories]);

  const resetForm = () => {
    setForm(emptyForm());
    setMainCategoryId("");
    setNutritionForm(emptyNutritionForm());
    setEditingId(null);
    setShowForm(false);
  };

  const resolveNutritionPayload = (): NutritionFacts | null => {
    if (editingId != null) {
      return form.nutrition ?? null;
    }
    return buildNutritionFactsFromForm(nutritionForm);
  };

  const refreshProducts = () => invalidateMenuProducts(queryClient, resolvedMenuId, qrId);

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      notify("warning", "Ürün adı zorunlu.");
      return;
    }
    if (!form.subCategoryId) {
      notify("warning", "Alt kategori seçimi zorunlu.");
      return;
    }

    const nutrition = resolveNutritionPayload();
    if (editingId == null && !nutrition) {
      notify("warning", "Zorunlu besin alanlarını doldurun.");
      return;
    }

    const payload: MenuProductRequestBody = {
      ...form,
      nutrition: nutrition ?? undefined,
    };

    try {
      if (editingId != null) {
        await updateMenuProductRequest(editingId, payload);
        notify("info", "Ürün güncellendi.");
        resetForm();
        await refreshProducts();
      } else {
        const created = await createMenuProductRequest(resolvedMenuId, payload);
        notify("info", "Ürün eklendi.");
        resetForm();
        await refreshProducts();
        if (qrId != null) {
          router.push(DASHBOARD_ROUTES.digitalMenuProductDetail(created.productId, qrId));
        }
      }
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "İşlem başarısız.");
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      await deleteMenuProductRequest(productId);
      notify("info", "Ürün silindi.");
      await refreshProducts();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Ürün silinemedi.");
    }
  };

  const handleSmartSummary = async () => {
    if (!canUseSmartSummary) {
      notify("warning", "Akıllı Özet için paketinizde bu özellik bulunmuyor.");
      router.push(DASHBOARD_ROUTES.accountPackagesHighlight("SMART_SUMMARY"));
      return;
    }
    if (!form.name?.trim()) {
      notify("warning", "Akıllı özet için önce ürün adı girin.");
      return;
    }
    const selectedTags = tags.filter((tag) => (form.tagIds ?? []).includes(tag.id));
    const selectedAllergens = allergens.filter((item) =>
      (form.allergenIds ?? []).includes(item.id),
    );
    const priceText =
      form.price != null && String(form.price).trim() !== ""
        ? String(form.price).trim()
        : undefined;
    setSummaryLoading(true);
    try {
      const result = await createSmartSummaryRequest({
        product: {
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          price: priceText,
          currency: form.currency || "TRY",
          mainCategoryName: selectedMain?.name,
          subCategoryName: selectedSub?.name,
          tags: selectedTags.map((tag) => tag.name),
          allergens: selectedAllergens.map((item) => item.name),
          servesPeopleMin: form.servesPeopleMin ?? null,
          servesPeopleMax: form.servesPeopleMax ?? null,
          chefRecommended: Boolean(form.chefRecommended),
          available: form.available ?? true,
          nutrition: resolveNutritionPayload() ?? undefined,
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
          onClick={() => {
            resetForm();
            const presetSub = filterCategoryId === "all" ? null : filterCategoryId;
            const main = presetSub == null
              ? undefined
              : categories.find((item) => (item.subs ?? []).some((sub) => sub.id === presetSub));
            setMainCategoryId(main?.id ?? "");
            setForm(emptyForm(presetSub));
            setNutritionForm(emptyNutritionForm());
            setShowForm(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Ürün Ekle
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Ürün Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ana Kategori</Label>
              <SearchableSelect
                value={mainCategoryId === "" ? "" : String(mainCategoryId)}
                onValueChange={(next) => {
                  setMainCategoryId(next ? Number(next) : "");
                  setForm({ ...form, subCategoryId: 0 });
                }}
                options={mainCategorySelectOptions}
                placeholder="Ana kategori seçin"
                searchPlaceholder="Kategori ara..."
                emptyText="Kategori bulunamadı."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alt Kategori</Label>
              <SearchableSelect
                value={form.subCategoryId ? String(form.subCategoryId) : ""}
                onValueChange={(next) =>
                  setForm({
                    ...form,
                    subCategoryId: next ? Number(next) : 0,
                  })
                }
                options={subCategorySelectOptions}
                placeholder="Alt kategori seçin"
                searchPlaceholder="Alt kategori ara..."
                emptyText="Alt kategori bulunamadı."
                disabled={mainCategoryId === ""}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Etiketler</Label>
              <div className="flex flex-wrap gap-2 rounded-md border border-border p-2">
                {tags.map((tag) => {
                  const selected = (form.tagIds ?? []).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                      onClick={() => {
                        const current = new Set(form.tagIds ?? []);
                        if (current.has(tag.id)) current.delete(tag.id);
                        else current.add(tag.id);
                        setForm({ ...form, tagIds: Array.from(current) });
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Alerjen maddeler</Label>
              <div className="flex flex-wrap gap-2 rounded-md border border-border p-2">
                {allergens.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Alerjen yok.</p>
                ) : (
                  allergens.map((allergen) => {
                    const selected = (form.allergenIds ?? []).includes(allergen.id);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => {
                          const current = new Set(form.allergenIds ?? []);
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
            <div className="space-y-1.5">
              <Label className="text-xs">Fiyat</Label>
              <Input
                value={String(form.price ?? "")}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="120"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min kişi</Label>
              <Input
                type="number"
                min={1}
                value={form.servesPeopleMin ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    servesPeopleMin: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max kişi</Label>
              <Input
                type="number"
                min={1}
                value={form.servesPeopleMax ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    servesPeopleMax: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Açıklama</Label>
                <RainbowBeamButton
                  label="Akıllı Özet"
                  loading={summaryLoading}
                  disabled={summaryLoading}
                  onClick={() => void handleSmartSummary()}
                />
              </div>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <ProductImageField
                menuId={resolvedMenuId}
                value={form.imageUrl}
                onChange={(imageUrl) => setForm({ ...form, imageUrl: imageUrl ?? "" })}
                disabled={loading}
              />
            </div>
          </div>

          {editingId == null ? (
            <div className="space-y-3 rounded-md border border-border/60 p-3">
              <p className="text-xs font-medium text-foreground">Besin değerleri (zorunlu)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Birim</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={nutritionForm.basis}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, basis: e.target.value as NutritionBasis })
                    }
                  >
                    <option value="PER_100G">100g başına</option>
                    <option value="PER_100ML">100ml başına</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Enerji (kJ)</Label>
                  <Input
                    value={nutritionForm.energyKj}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, energyKj: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Enerji (kcal)</Label>
                  <Input
                    value={nutritionForm.energyKcal}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, energyKcal: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Yağ</Label>
                  <Input
                    value={nutritionForm.fat}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, fat: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Karbonhidrat</Label>
                  <Input
                    value={nutritionForm.carbohydrate}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, carbohydrate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Lif</Label>
                  <Input
                    value={nutritionForm.fibre}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, fibre: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Protein</Label>
                  <Input
                    value={nutritionForm.protein}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, protein: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tuz</Label>
                  <Input
                    value={nutritionForm.salt}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, salt: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSubmit()}>
              {editingId != null ? "Güncelle" : "Kaydet"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              İptal
            </Button>
          </div>
        </div>
      )}

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
