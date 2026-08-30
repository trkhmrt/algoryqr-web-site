"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import {
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import {
  buildNutritionFactsFromForm,
  emptyNutritionFacts,
} from "@/components/dashboard/menu/ProductNutritionPanel";
import { ProductImageField } from "@/components/dashboard/menu/ProductImageField";
import { ProductPairingFields, emptyPairings, normalizePairings } from "@/components/dashboard/menu/ProductPairingFields";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { SmartFeaturePanel } from "@/components/dashboard/SmartFeaturePanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMenuProductRequest,
  MenuProductRequestBody,
  NutritionBasis,
  NutritionFacts,
} from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { PRODUCT_HINTS } from "@/lib/product-hints";
import { createSmartSummaryRequest } from "@/lib/smart-summary";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useMenuCategories, useMenuAllergens, useMenuTags } from "@/hooks/use-menu-categories";
import { invalidateMenuProducts, useMenuProducts } from "@/hooks/use-menu-products";
import { useSmartSummaryAccess } from "@/hooks/use-smart-summary-access";
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";

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
  pairings: emptyPairings(),
});

export default function DigitalMenuProductCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const presetCategoryId = useMemo(() => {
    const raw = Number(searchParams.get("category"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const selectionState = useDigitalMenuSelection(initialQrId);
  const qrId = selectionState.selection?.qr.id ?? initialQrId;
  const menuId = selectionState.selection?.menu.menuId ?? 0;

  const categoriesQuery = useMenuCategories(menuId > 0 ? menuId : null);
  const tagsQuery = useMenuTags();
  const allergensQuery = useMenuAllergens();
  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const allergens = allergensQuery.data ?? [];
  const productsQuery = useMenuProducts(menuId > 0 ? menuId : null);

  const [form, setForm] = useState<MenuProductRequestBody>(() => emptyForm(presetCategoryId));
  const [mainCategoryId, setMainCategoryId] = useState<number | "">("");
  const [nutritionForm, setNutritionForm] = useState<NutritionFormFields>(emptyNutritionForm());
  const [saving, setSaving] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (presetCategoryId == null || categories.length === 0) return;
    const main = categories.find((item) =>
      (item.subs ?? []).some((sub) => sub.id === presetCategoryId),
    );
    if (main) setMainCategoryId(main.id);
  }, [categories, presetCategoryId]);

  useEffect(() => {
    if (categoriesQuery.isError) {
      notify(
        "danger",
        categoriesQuery.error instanceof Error
          ? categoriesQuery.error.message
          : "Kategoriler yüklenemedi.",
      );
    }
  }, [categoriesQuery.error, categoriesQuery.isError, notify]);

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

  const backHref =
    qrId != null
      ? DASHBOARD_ROUTES.digitalMenuProductsForQr(qrId)
      : DASHBOARD_ROUTES.digitalMenuProducts;

  const resolveNutritionPayload = (): NutritionFacts | null => {
    const kcal = Number(String(nutritionForm.energyKcal).replace(",", "."));
    const energyKj =
      nutritionForm.energyKj.trim() !== ""
        ? nutritionForm.energyKj
        : Number.isFinite(kcal)
          ? String(Math.round(kcal * 4.184))
          : "";
    return buildNutritionFactsFromForm({
      ...nutritionForm,
      energyKj,
      fibre: nutritionForm.fibre.trim() !== "" ? nutritionForm.fibre : "0",
    });
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      notify("warning", "Ürün adı zorunlu.");
      return;
    }
    if (!form.subCategoryId) {
      notify("warning", "Alt kategori seçimi zorunlu.");
      return;
    }
    if (menuId <= 0) {
      notify("warning", "Menü bilgisi yüklenemedi.");
      return;
    }

    const nutrition = resolveNutritionPayload();
    if (!nutrition) {
      notify("warning", "Zorunlu besin alanlarını doldurun.");
      return;
    }

    setSaving(true);
    try {
      const created = await createMenuProductRequest(menuId, {
        ...form,
        nutrition,
      });
      notify("info", "Ürün eklendi.");
      await invalidateMenuProducts(queryClient, menuId, qrId ?? undefined);
      router.push(
        qrId != null
          ? DASHBOARD_ROUTES.digitalMenuProductDetail(created.productId, qrId)
          : backHref,
      );
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "İşlem başarısız.");
    } finally {
      setSaving(false);
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
      notify("danger", error instanceof Error ? error.message : "Akıllı özet üretilemedi.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const busy = saving || summaryLoading;

  return (
    <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="Ürün Ekle"
          hint="Ürün bilgilerini girin ve bir alt kategoriye bağlayın."
          back={
            <Link href={backHref} aria-label="Ürün listesine dön" className={DASHBOARD_BACK}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />

        <div className={`${DASHBOARD_PANEL} space-y-3`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Ürün Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
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
            <div className="space-y-1.5">
              <Label className="text-xs">Fiyat</Label>
              <Input
                value={String(form.price ?? "")}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="120"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="sm:col-span-2">
              <ProductImageField
                menuId={menuId}
                value={form.imageUrl}
                onChange={(imageUrl) => setForm({ ...form, imageUrl: imageUrl ?? "" })}
                disabled={busy || menuId <= 0}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border/60 p-3">
            <p className="text-xs font-medium text-foreground">Besin değerleri (zorunlu)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Birim</Label>
                <SearchableSelect
                  value={nutritionForm.basis}
                  onValueChange={(next) =>
                    setNutritionForm({ ...nutritionForm, basis: next as NutritionBasis })
                  }
                  options={[
                    { value: "PER_100G", label: "100g başına" },
                    { value: "PER_100ML", label: "100ml başına" },
                  ]}
                  placeholder="Birim seçin"
                  searchPlaceholder="Birim ara..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Enerji (kcal)</Label>
                <Input
                  value={nutritionForm.energyKcal}
                  onChange={(e) =>
                    setNutritionForm({ ...nutritionForm, energyKcal: e.target.value })
                  }
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

          <ProductPairingFields
            pairings={normalizePairings(form.pairings)}
            onChange={(pairings) => setForm({ ...form, pairings })}
            products={productsQuery.data ?? []}
            categories={categories}
            disabled={busy}
          />

          <div className="space-y-1.5">
            <Label className="text-xs">Etiketler</Label>
            <div className="flex flex-wrap gap-2 rounded-md border border-border p-2">
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">Etiket yok.</p>
              ) : (
                tags.map((tag) => {
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
                })
              )}
            </div>
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-3">
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
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => void handleSubmit()}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={backHref}>İptal</Link>
            </Button>
          </div>
        </div>
    </div>
  );
}
